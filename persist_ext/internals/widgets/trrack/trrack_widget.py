import traitlets
import traitlets.traitlets

from persist_ext.internals.utils.entry_paths import get_widget_esm_css
from persist_ext.internals.utils.logger import logger
from persist_ext.internals.widgets.trrack_widget_base import WidgetWithTrrack


class TrrackWidget(WidgetWithTrrack):
    _esm, _css = get_widget_esm_css("trrack")

    interactions = traitlets.List().tag(sync=True)

    cell_id = traitlets.Unicode("").tag(sync=True)

    @traitlets.observe("trrack")
    def _on_trrack(self, change):
        new_trrack_instance = change.new
        logger.info(type(new_trrack_instance))
        logger.info("Trrack update")
