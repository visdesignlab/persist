from altair import Chart, TopLevelSpec
from pandas import DataFrame
import traitlets
from persist_ext.internals.widgets.base.base_output_object import OutputObject
from persist_ext.internals.widgets.base.widget_with_generation import (
    WidgetWithGeneration,
)


Base = WidgetWithGeneration


def DEFAULT_DATA_ACCESSOR(obj):
    if isinstance(obj, DataFrame):
        return obj
    elif isinstance(obj, Chart):
        return obj.data
    return obj


class PersistWidget(Base):
    __widget_key = "persist_output"

    is_chart = traitlets.Bool(default_value=False).tag(sync=True)

    def __init__(self, obj, id_column, df_name, data_accessor, *args, **kwargs):
        is_chart = isinstance(obj, Chart)
        chart = None
        data = None

        if is_chart:
            chart = obj
        data = data_accessor(obj)

        if chart is None and data is None:
            raise ValueError("Invalid object passed to PersistWidget")

        self.output = OutputObject(widget=self)

        super(PersistWidget, self).__init__(
            df_name=df_name,
            id_column=id_column,
            chart=chart,
            data=data,
            widget_key=self.__widget_key,
            is_chart=is_chart,
            *args,
            **kwargs,
        )
