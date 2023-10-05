import traitlets
from traitlets.traitlets import Unicode

from persist_ext.internals.utils.entry_paths import get_widget_esm_css
from persist_ext.internals.widgets.trrack_widget_base import WidgetWithTrrack


class HeaderWidget(WidgetWithTrrack):
    _esm, _css = get_widget_esm_css("header")

    cell_id = Unicode("").tag(sync=True)

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
