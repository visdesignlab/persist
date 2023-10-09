import traitlets
import traitlets.traitlets
from pandas import DataFrame

from persist_ext.internals.utils.entry_paths import get_widget_esm_css
from persist_ext.internals.widgets.trrack_widget_base import WidgetWithTrrack


class IntentWidget(WidgetWithTrrack):
    _esm, _css = get_widget_esm_css("intent")

    cell_id = traitlets.Unicode("").tag(sync=True)

    intents = traitlets.List([]).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.data = DataFrame()

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
