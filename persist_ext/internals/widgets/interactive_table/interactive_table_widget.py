from io import BytesIO

import pandas as pd
import traitlets
from pandas import DataFrame

from persist_ext.internals.data.idfy import ID_COLUMN
from persist_ext.internals.widgets.base.body_widget_base import BodyWidgetBase
from persist_ext.internals.widgets.interactions.selection import SELECTED_COLUMN_BRUSH


class InteractiveTableWidget(BodyWidgetBase):
    __widget_key = "interactive_table"

    cell_id = traitlets.Unicode("").tag(sync=True)  # to sync with trrack

    _data = traitlets.Instance(DataFrame)

    df_selection_status = traitlets.Dict().tag(sync=True)
    df_sort_status = traitlets.List([]).tag(sync=True)

    def __init__(self, data):
        super(InteractiveTableWidget, self).__init__(
            widget_key=self.__widget_key, data=data
        )
        self._data = data.copy(deep=True)

    def _copy_vars(self):
        data = self._persistent_data.copy(deep=True)
        _ = None
        return data, _

    def _update_copies(self, data, _):
        self.data = data

    def _to_cache(self, data, _):
        data = data.to_parquet(compression="brotli")
        return data, _

    def _from_cache(self, data, _):
        data = pd.read_parquet(BytesIO(data))
        return data, _

    def _get_data(self, data, *args, **kwargs):
        return data

    def _apply_create(self, _interaction, data, _):
        return data, _

    def _clear_selections(self, data):
        data = self._clear_selection_data(data)
        return data

    def _apply_select(self, interaction, data, _):
        value = interaction["value"]

        selected_ids = list(map(lambda x: x[ID_COLUMN], value))

        data[SELECTED_COLUMN_BRUSH] = False
        data.loc[data[ID_COLUMN].isin(selected_ids), SELECTED_COLUMN_BRUSH] = True

        return data, _

    def _apply_filter(self, interaction, data, _):
        direction = interaction["direction"]

        data = self._filter_common(data, direction)
        data = self._clear_selections(data)

        return data, _

    def _apply_rename_column(self, interaction, data, _):
        print(interaction)
        data = self._rename_columns_common(data, interaction)

        return data, _

    def _apply_drop_columns(self, interaction, data, _):
        columns = interaction["columns"]
        if columns is None:
            columns = []

        data = self._drop_columns_common(data, columns)

        return data, _

    def _apply_categorize(self, interaction, data, _):
        data = self._categorize_common(data, interaction)
        data = self._clear_selections(data)

        return data, _

    def _apply_annotate(self, interaction, data, _):
        data = self._annotate_common(data, interaction)
        data = self._clear_selections(data)

        return data, _

    def _apply_sortby_column(self, interaction, data, _):
        sort_status = interaction["sortStatus"]

        data = data.sort_values(
            list(map(lambda x: x["column"], sort_status)),
            ascending=list(map(lambda x: x["direction"] == "asc", sort_status)),
        )
        self.df_column_sort_status = sort_status

        return data, _

    def _apply_reorder_column(self, interaction, data, _):
        cols = interaction["columns"]

        cols.extend(self.df_meta_columns)

        cols = list(filter(lambda x: x in data, cols))

        data = data[cols]

        return data, _
