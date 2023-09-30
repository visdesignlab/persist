from persist_ext.internals.widgets.trrack_widget_base import WidgetWithTrrack
from persist_ext.internals.utils.logger  import logger
import traitlets
from traitlets.traitlets import Unicode

from persist_ext.internals.utils.entry_paths import get_widget_esm_css


class HeaderWidget(WidgetWithTrrack):
    _esm, _css = get_widget_esm_css("header")

    cell_id = Unicode("").tag(sync=True)

    @traitlets.observe("trrack")
    def _on_trrack(self, change):
        logger.info("Header update")
