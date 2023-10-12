import numpy as np
import traitlets
from pandas import DataFrame

from persist_ext.internals.utils.logger import logger
from persist_ext.internals.widgets.base.body_widget_base import BodyWidgetBase
from persist_ext.internals.widgets.vegalite_chart.interaction_types import (
    ANNOTATE,
    CATEGORIZE,
    CREATE,
    DROP_COLUMNS,
    FILTER,
    RENAME_COLUMN,
    REORDER_COLUMNS,
    SELECT,
    SORT_BY_COLUMN,
)


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

    @traitlets.observe("interactions")
    def _on_update_interactions(self, change):
        data = self._data.copy(deep=True)

        selected_arr = None
        sort_status = []

        with self.hold_sync():
            interactions = change.new

            for interaction in interactions:
                _type = interaction["type"]

                if _type == CREATE:
                    continue
                elif _type == SELECT:
                    selected_arr = np.full(data.shape[0], False)

                    value = interaction["value"]

                    for selection in value:
                        selected = selection["index"]
                        selected_arr[selected - 1] = True
                elif _type == FILTER:
                    continue
                elif _type == ANNOTATE:
                    continue
                elif _type == RENAME_COLUMN:
                    previous_column_name = interaction["previousColumnName"]
                    new_column_name = interaction["newColumnName"]

                    data = data.rename(columns={previous_column_name: new_column_name})
                elif _type == DROP_COLUMNS:
                    columns = interaction["columns"]
                    if len(columns) > 0:
                        data = data.drop(columns, axis=1)
                elif _type == CATEGORIZE:
                    continue
                elif _type == SORT_BY_COLUMN:
                    sort_status = interaction["sortStatus"]
                    data = data.sort_values(
                        list(map(lambda x: x["column"], sort_status)),
                        ascending=list(
                            map(lambda x: x["direction"] == "asc", sort_status)
                        ),
                    )
                elif _type == REORDER_COLUMNS:
                    cols = interaction["columns"]
                    cols = list(filter(lambda x: x in data, cols))
                    data = data[cols]
                else:
                    logger.info("---")
                    logger.info("Misc")
                    logger.info(interaction)
                    logger.info("---")

            if selected_arr is not None:
                self.df_selection_status = {
                    f"{ i + 1 }": status
                    for i, status in enumerate(selected_arr.tolist())
                    if status
                }
            else:
                self.df_selection_status = {}
            self.df_sort_status = sort_status
            self.data = data
