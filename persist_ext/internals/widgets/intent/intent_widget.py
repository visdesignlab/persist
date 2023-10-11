import traitlets
import traitlets.traitlets
from pandas import DataFrame

from persist_ext.internals.widgets.trrack_widget_base import WidgetWithTrrack


class IntentWidget(WidgetWithTrrack):
    __widget_key = "intent"

    cell_id = traitlets.Unicode("").tag(sync=True)

    intents = traitlets.List([]).tag(sync=True)

    def __init__(self):
        super(IntentWidget, self).__init__(widget_key=self.__widget_key)
        self.data = DataFrame()

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
