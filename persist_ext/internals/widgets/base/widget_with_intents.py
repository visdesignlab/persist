import traitlets
from persist_ext.internals.widgets.base.widget_with_interactions import (
    WidgetWithInteractions,
)


class WidgetWithIntents(WidgetWithInteractions):
    # Sidebar
    intents = traitlets.List([]).tag(sync=True)
    loading_intents = traitlets.Bool(False).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super(WidgetWithIntents, self).__init__(*args, **kwargs)
