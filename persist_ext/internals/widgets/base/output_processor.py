from __future__ import annotations

import pandas as pd  # noqa
from typing import TYPE_CHECKING

from altair import Undefined
from pandas.api.types import CategoricalDtype
from persist_ext.internals.data.idfy import ID_COLUMN
from persist_ext.internals.data.utils import is_float

from persist_ext.internals.widgets.interactions.annotation import (
    ANNOTATE_COLUMN_NAME,
    NO_ANNOTATION,
    create_annotation_string,
)
from persist_ext.internals.widgets.interactions.categorize import NONE_CATEGORY_OPTION
from persist_ext.internals.widgets.interactions.selection import (
    SELECTED_COLUMN_BRUSH,
    SELECTED_COLUMN_INTENT,
    selected,
)
from persist_ext.internals.widgets.vegalite_chart.parameters import get_param_name
from persist_ext.internals.widgets.vegalite_chart.utils import (
    add_new_nominal_encoding_recursive,
    add_tooltip_encoding_recursive,
    update_field_names,
)

if TYPE_CHECKING:
    from persist_ext.internals.widgets.persist_output.widget import PersistWidget


class OutputProcessor:
    def __init__(self, widget: "PersistWidget"):  # noqa
        self.widget = widget

    def _chart_check(self, chart):
        if chart is not None:
            raise NotImplementedError("Implement for chart")

    def _apply_create(self, interaction, data, chart):
        return data, chart

    # ------------ Select -------------------
    def _update_selection_param(
        self, chart, selection, param_list_idx, value=None, store=[]
    ):
        selection_spec = chart.params[param_list_idx]

        if value is None and len(store) == 0:
            # clear if no value and empty store
            selection.clear_selection()
            selection_spec.value = Undefined
        else:
            # Set value if provided
            selection.update_selection(value, store)
            selection_spec.value = selection.brush_value()

        return chart

    def _clear_selections(self, data, chart):
        data = self._clear_selection_data(data)
        chart = self._clear_all_selection_params(chart)

        return data, chart

    def _clear_selection_data(self, data):
        data[SELECTED_COLUMN_BRUSH] = False
        data[SELECTED_COLUMN_INTENT] = False

        return data

    def _clear_all_selection_params(self, chart):
        if not chart:
            return chart

        for param in getattr(chart, "params", []):
            selection = self.widget.selections.get(get_param_name(param))

            if selection is None:
                continue

            param.value = Undefined
            selection.clear_selection()

        return chart

    # ------------ Selection -------------------
    def _apply_select(self, interaction, data, chart):
        brush_type = interaction["brush_type"]

        if brush_type == "non-vega":
            name = interaction["name"]
            values = interaction["value"]

            data[SELECTED_COLUMN_BRUSH] = False

            data.loc[
                data[name].isin(values),
                SELECTED_COLUMN_BRUSH,
            ] = True
        else:
            # Chart
            if chart:
                selection_name = interaction["name"]
                store = interaction["store"]
                value = interaction["value"]

                selection = self.widget.selections.get(selection_name)

                if not selection:
                    raise ValueError(
                        f"Selection {selection_name} not found. Are you using named selections?"  # noqa: E501
                    )

                # Get index of selection in chart spec
                param_idx = [get_param_name(p) for p in chart.params].index(
                    selection.name
                )

                # Update selection traitlet and chart spec together
                chart = self._update_selection_param(
                    chart, selection, param_idx, value, store
                )

                data[SELECTED_COLUMN_BRUSH] = False
                data.loc[
                    data.query(selection.query(direction="in")).index,
                    SELECTED_COLUMN_BRUSH,
                ] = True

        return data, chart

    # ------------ Filter -------------------
    def _apply_filter(self, interaction, data, chart):
        direction = interaction["direction"]

        if direction == "in":
            data = data[selected(data)]
        else:
            data = data[~selected(data)]

        data = data.reset_index(drop=True)

        data, chart = self._clear_selections(data, chart)

        return data, chart

    # ------------ Rename Column -------------------
    def _apply_rename_column(self, interaction, data, chart):
        rename_column_map = interaction["renameColumnMap"]

        data = data.rename(columns=rename_column_map)

        if chart:
            chart = update_field_names(chart, rename_column_map)

        return data, chart

    # ------------ Drop Column -------------------
    def _apply_drop_columns(self, interaction, data, chart):
        columns = interaction["columns"]
        if columns is None:
            columns = []

        if len(columns) > 0:
            data = data.drop(columns, axis=1)

        return data, chart

    # ------------ Categorize -------------------
    def _apply_category(self, interaction, data, chart):
        action = interaction["action"]

        op = action["op"]
        scope = action["scope"]

        if scope == "category":
            if op == "add":
                category = action["category"]
                data[category] = NONE_CATEGORY_OPTION
                cols = data.columns.tolist()
                cols.insert(0, cols.pop())

                data = data.reindex(columns=cols)

                data[category] = data[category].astype("category")
            elif op == "remove":
                category = action["category"]
                if category in data:
                    data = data.drop(columns=[category], axis=1)
        elif scope == "option" or scope == "options":
            category = action["category"]
            option = action["option"]

            category_options = data[category].cat.categories.tolist()
            ordered = data[category].cat.ordered

            if op == "assign":
                if option not in category_options:
                    raise ValueError(
                        f"{option} not valid for column '{category}'. Valid values are {category_options}"
                    )
                data.loc[selected(data), category] = option

            else:
                if op == "reorder":
                    if isinstance(option, bool):
                        ordered = option
                    elif isinstance(option, list):
                        category_options = option
                        ordered = True
                elif op == "add":
                    category_options.append(option)
                elif op == "remove":
                    category_options = list(
                        filter(lambda x: x != option, category_options)
                    )
                    data.loc[data[category] == option, category] = None

                if NONE_CATEGORY_OPTION in category_options:
                    idx = category_options.index(NONE_CATEGORY_OPTION)
                    category_options.pop(idx)

                if NONE_CATEGORY_OPTION not in category_options:
                    category_options.append(NONE_CATEGORY_OPTION)

                data[category] = data[category].astype(
                    CategoricalDtype(categories=category_options, ordered=ordered)
                )

        category = action["category"]
        if chart and category in data:
            category_options = data[category].cat.categories.tolist()

            chart = add_new_nominal_encoding_recursive(
                chart, category, category_options
            )

        return data, chart

    # ------------ Annotation -------------------
    def _apply_annotate(self, interaction, data, chart):
        text = interaction["text"]
        created_on = interaction["createdOn"]
        annotation_str = create_annotation_string(text, created_on)

        def _append_annotation(val):
            if val == NO_ANNOTATION:
                return annotation_str
            return f"{val}; {annotation_str}"

        data.loc[selected(data), ANNOTATE_COLUMN_NAME] = data.loc[
            selected(data), ANNOTATE_COLUMN_NAME
        ].apply(_append_annotation)

        if chart:
            chart = add_tooltip_encoding_recursive(chart, ANNOTATE_COLUMN_NAME)

        return data, chart

    # ------------ Column Type Change -------------------
    def _apply_column_type_change(self, interaction, data, chart):
        column_type_map = interaction["columnDataTypes"]

        for column, new_col_type_info in column_type_map.items():
            _type = new_col_type_info["type"]

            if "format" in new_col_type_info:
                format = new_col_type_info["format"]

            if _type == "Int64":
                data[column] = pd.to_numeric(data[column], errors="coerce").astype(
                    "Int64"
                )
            elif _type == "Float64":
                data[column] = pd.to_numeric(data[column], errors="coerce").astype(
                    "Float64"
                )
            elif _type == "boolean":
                data[column] = data[column].apply(bool).astype("boolean")
            elif _type == "datetime64[ns]":
                data[column] = pd.to_datetime(
                    data[column], errors="coerce", format=format
                )
            elif _type == "category":
                unique_values = data[column].unique().tolist()
                unique_values = list(sorted(unique_values))
                data[column] = data[column].astype(
                    CategoricalDtype(categories=unique_values, ordered=True)
                )
            elif _type == "string":
                data[column] = data[column].astype("string")
        return data, chart

    # ------------ Edit Cell -------------------
    def _apply_edit_cell(self, interaction, data, chart):
        column_name = interaction["columnName"]
        idx = interaction["idx"]
        value = interaction["value"]

        if self.widget.df_column_types[column_name] == "datetime64[ns]":
            value = pd.to_datetime(value, unit="ms", utc=False).tz_localize(None)

        data.loc[data[self.widget.id_column] == idx, column_name] = value

        data = data.convert_dtypes()

        return data, chart

    # ------------ Sort column -------------------
    def _apply_sortby_column(self, interaction, data, chart):
        sort_status = interaction["sortStatus"]

        if len(sort_status) == 0:
            data = data.sort_values(
                by=self.widget.id_column,
                ascending=True,
                key=(lambda x: x.astype("Float64") if x.apply(is_float).all() else x),
            )

        data = data.sort_values(
            list(map(lambda x: x["id"], sort_status)),
            ascending=list(map(lambda x: not x["desc"], sort_status)),
        )

        self.widget.df_sorting_state = sort_status

        return data, chart

    # ------------ Reorder column -------------------
    def _apply_reorder_column(self, interaction, data, _):
        cols = interaction["columns"]

        cols.extend(filter(lambda x: x not in cols, self.widget.df_columns_meta))
        cols.append(self.widget.id_column)

        cols = list(filter(lambda x: x in data, cols))

        data = data[cols]

        return data, _
