from __future__ import annotations
from typing import TYPE_CHECKING

from altair import Undefined
from persist_ext.internals.widgets.interactions.selection import (
    SELECTED_COLUMN_BRUSH,
    SELECTED_COLUMN_INTENT,
    selected,
)

from persist_ext.internals.widgets.vegalite_chart.parameters import get_param_name
from persist_ext.internals.widgets.vegalite_chart.utils import (
    add_new_nominal_encoding_recursive,
    update_field_names,
)

from pandas.api.types import CategoricalDtype


if TYPE_CHECKING:
    from persist_ext.internals.widgets.persist_output.widget import PersistWidget


class OutputObject:
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

        chart.encoding.color = self.widget._persistent_chart.encoding.color

        for param in getattr(chart, "params", []):
            selection = self.widget.selections.get(get_param_name(param))

            if selection is None:
                continue

            param.value = Undefined
            selection.clear_selection()

        return chart

    def _apply_select(self, interaction, data, chart):
        brush_type = interaction["brush_type"]

        if brush_type == "non-vega":
            return data, chart
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
                data[category] = None
                cols = data.columns.tolist()
                cols.insert(0, cols.pop())

                data = data.reindex(columns=cols)

                data[category] = data[category].astype("category")
            elif op == "remove":
                category = action["category"]
                if category in data:
                    data = data.drop(columns=[category], axis=1)
        elif scope == "options":
            category = action["category"]
            option = action["option"]
            if op == "reorder":
                if isinstance(option, bool):
                    data[category] = data[category].astype(
                        CategoricalDtype(
                            categories=data[category].cat.categories, ordered=option
                        )
                    )
                elif isinstance(option, list):
                    data[category] = data[category].astype(
                        CategoricalDtype(categories=option, ordered=True)
                    )

        # data, chart = self._clear_selections(data, chart)
        # category = interaction["category"]
        # option = interaction["option"]
        #
        # if category not in data:
        #     data[category] = "_None"
        #
        # data.loc[selected(data), category] = option
        #
        # category = interaction["category"]
        #
        # chart = add_new_nominal_encoding_recursive(
        #     chart,
        #     category,
        # )

        return data, chart
