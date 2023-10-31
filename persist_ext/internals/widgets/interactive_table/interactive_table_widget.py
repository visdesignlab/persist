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
        data.loc[data[ID_COLUMN].isin(selected_ids), [SELECTED_COLUMN_BRUSH]] = True

        return data, _

    def _apply_intent(self, interaction, data, _):
        return data, _

    def _apply_filter(self, interaction, data, _):
        direction = interaction["direction"]

        data = self._filter_common(data, direction)
        data = self._clear_selections(data)

        return data, _

    def _apply_rename_column(self, interaction, data, _):
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

        data[ID_COLUMN] = data[ID_COLUMN].astype("Int64")

        if len(sort_status) == 0:
            data = data.sort_values(by=ID_COLUMN, ascending=True)

        data = data.sort_values(
            list(map(lambda x: x["id"], sort_status)),
            ascending=list(map(lambda x: not x["desc"], sort_status)),
        )

        data[ID_COLUMN] = data[ID_COLUMN].astype(str)

        self.df_column_sort_status = sort_status

        return data, _

    def _apply_reorder_column(self, interaction, data, _):
        cols = interaction["columns"]

        cols.extend(self.df_meta_columns)

        cols = list(filter(lambda x: x in data, cols))

        data = data[cols]

        return data, _

    def _apply_edit_cell(self, interaction, data, _):
        column_name = interaction["columnName"]
        idx = interaction["idx"]
        value = interaction["value"]

        if self.df_column_dtypes[column_name] == "datetime64[ns]":
            value = pd.to_datetime(value, unit="ms", utc=False).tz_localize(None)

        data.loc[data[self.df_id_column_name] == idx, column_name] = value

        data = data.convert_dtypes()

        return data, _

    def _apply_column_type_change(self, interaction, data, _):
        column_type_map = interaction["columnDataTypes"]

        data = data.astype(column_type_map)

        return data, _
