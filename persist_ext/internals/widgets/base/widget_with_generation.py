import traitlets
from persist_ext.internals.widgets.base.widget_with_intents import WidgetWithIntents


class WidgetWithGeneration(WidgetWithIntents):
    generated_dataframe_counter = traitlets.Int(default_value=0).tag(sync=True)
    df_dynamic_name = traitlets.Unicode("").tag(sync=True)

    def __init__(self, df_name, *args, **kwargs):
        super(WidgetWithGeneration, self).__init__(
            df_dynamic_name=df_name, *args, **kwargs
        )
