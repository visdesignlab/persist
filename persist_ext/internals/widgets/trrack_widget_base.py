import json

import anywidget
import traitlets
from pandas import DataFrame


class WidgetWithTrrack(anywidget.AnyWidget):
    trrack = traitlets.Dict().tag(sync=True)
    interactions = traitlets.List().tag(sync=True)
    data = traitlets.Instance(DataFrame)
    df_columns = traitlets.List().tag(sync=True)
    df_values = traitlets.List().tag(sync=True)

    renamed_column_record = {}

    def __init__(self, *args, **kwargs):
        if type(self) is WidgetWithTrrack:
            raise NotImplementedError("Cannot create instance of this base class")

        super(WidgetWithTrrack, self).__init__(*args, **kwargs)

    @traitlets.observe("data")
    def _handle_data_update(self, change):
        new_data = change.new

        columns = list(filter(lambda x: x != "index", new_data.columns))
        values = json.loads(new_data[columns].to_json(orient="records"))

        with self.hold_sync():
            self.df_columns = columns
            self.df_values = values


class BodyWidgetBase(WidgetWithTrrack):
    intents = traitlets.List([]).tag(sync=True)

    def __init__(self, data, **kwargs):
        if type(self) is BodyWidgetBase:
            raise NotImplementedError("Cannot create instance of this base class")

        super(BodyWidgetBase, self).__init__(data=data, **kwargs)
