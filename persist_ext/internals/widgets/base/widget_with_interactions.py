import re
from io import BytesIO

import jinja2
import pandas as pd
import traitlets
from pandas.api.types import CategoricalDtype

from persist_ext.internals.widgets.base.widget_with_chart import (
    WidgetWithChart,
    copy_altair_chart,
)
from persist_ext.internals.widgets.interactions.code_templates import (
    ADD_IDS,
    ADD_SELECTION_COLUMN,
    COPY_DF,
    CREATE_FUNC_DEF,
    RETURN_DF,
    get_category_code,
    get_drop_columns_code,
    get_filter_code,
    get_rename_columns_code,
    get_selection_code,
)
from persist_ext.internals.widgets.interactions.selection import SELECTED_COLUMN_BRUSH


class WidgetWithInteractions(WidgetWithChart):
    interactions = traitlets.List().tag(sync=True)
    code_lines = traitlets.List([]).tag(sync=True)
    code = traitlets.Unicode("").tag(sync=True)
    df_template_name = "__DF_TEMPLATE_NAME__"
    is_applying = traitlets.Bool(default_value=False).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super(WidgetWithInteractions, self).__init__(*args, **kwargs)
        self.update_dynamic_df = None
        self.cache = InteractionApplyCache()

    def render_code(self, name, template=[CREATE_FUNC_DEF, RETURN_DF]):
        jinja_env = jinja2.Environment()
        code_template = jinja_env.from_string("\n".join(template))
        code = code_template.render(
            {
                "df_name": name,
                "indent": "    ",
                "id_col": f'"{self.id_column}"',
                "selection_column": SELECTED_COLUMN_BRUSH,
            }
        )
        self.code = code

    @traitlets.observe("interactions")
    def _on_interaction_change(self, change):
        interactions = change.new

        self._interaction_change(interactions)
        self.finish()

    def _interaction_change(self, interactions):
        self.is_applying = True

        data, chart = self.copy_original_data(), self.copy_original_chart()

        try:
            with self.hold_sync():
                self.df_sorting_state = []
                data, chart = self._apply_interactions(interactions, data, chart)
                self.data = data
                if chart is not None:
                    chart.data = data
                    self.chart = chart
        except Exception as e:
            raise e
        finally:
            self.is_applying = False

    def _get_template(self, _type, interaction):
        templates = []
        if _type == "create":
            templates.append(CREATE_FUNC_DEF)
            templates.append(COPY_DF)
            templates.append(ADD_IDS)
            templates.append(ADD_SELECTION_COLUMN)
        elif _type == "select":
            selection_code = get_selection_code(interaction)
            templates.append(selection_code)
        elif _type == "filter":
            filter_code = get_filter_code(interaction)
            templates.append(filter_code)
        elif _type == "rename_column":
            rename_column_code = get_rename_columns_code(interaction)
            templates.append(rename_column_code)
        elif _type == "drop_columns":
            drop_columns_code = get_drop_columns_code(interaction)
            templates.append(drop_columns_code)
        elif _type == "category":
            category_code = get_category_code(interaction)
            templates.append(category_code)
        else:
            print(f"Interaction type: {_type} not found")
            print(interaction)
        return templates

    def _apply_interactions(self, interactions, data, chart):
        template = []
        for interaction in interactions:
            _type = interaction["type"]

            code_templates = self._get_template(_type, interaction)
            template.extend(code_templates)

            if self.cache.has(interaction):
                self.cache.set_cache_hit(interaction)
            else:
                if self.cache.last_cache_hit_key is not None:
                    data, chart = self.cache.get(self.cache.last_cache_hit_key)
                    self.cache.reset_cache_hit()

                fn_name = f"_apply_{_type}"
                if hasattr(self.output, fn_name):
                    fn = getattr(self.output, fn_name)

                    data, chart = fn(interaction, data, chart)

                    self.cache.save(interaction, data, chart)
                else:
                    raise NotImplementedError(
                        f"Apply method: {fn_name}, not found on output class 'BaseOutputObject'"
                    )

        if self.cache.last_cache_hit_key is not None:
            data, chart = self.cache.get(self.cache.last_cache_hit_key)

        template.append(RETURN_DF)

        self.render_code(self.df_template_name, template)

        return data, chart

    def finish(self):
        pass


def _id(interaction):
    if "id" not in interaction:
        raise Exception("Interaction does not have an id")
    return interaction["id"]


class InteractionApplyCache:
    def __init__(self):
        self.cache = dict()

        self.last_cache_hit_key = None

    def reset_cache_hit(self):
        self.set_cache_hit()

    def set_cache_hit(self, interaction=None):
        if interaction is None:
            self.last_cache_hit_key = None
        else:
            id = _id(interaction)
            self.last_cache_hit_key = id

    def has(self, interaction):
        return _id(interaction) in self.cache

    def get(self, key):
        if key not in self.cache:
            raise Exception("Key not in cache")

        return self.from_cache(key)

    def save(self, interaction, data, chart):
        id = _id(interaction)
        data, cat_types_dict, chart = self.to_cache(data, chart)
        self.cache[id] = (data, cat_types_dict, chart)

    def from_cache(self, id):
        data, cat_types_dict, chart = self.cache[id]
        data = pd.read_parquet(BytesIO(data))

        for k, v in cat_types_dict.items():
            data[k] = data[k].astype(
                CategoricalDtype(categories=v["categories"], ordered=v["ordered"])
            )

        chart = copy_altair_chart(chart)
        return data, chart

    def to_cache(self, data, chart):
        cat_type_dict = dict()

        for col in data.select_dtypes(include=["category"]):
            series = data[col]

            cat_type_dict[col] = {
                "categories": series.cat.categories.tolist(),
                "ordered": series.cat.ordered,
            }

        data = data.to_parquet(compression="brotli")
        chart = copy_altair_chart(chart)
        return data, cat_type_dict, chart
