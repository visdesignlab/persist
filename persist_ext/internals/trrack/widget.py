import anywidget
import traitlets.traitlets

from persist_ext.internals.utils.entry_paths import get_widget_esm_css


class TrrackWidget(anywidget.AnyWidget):
    _esm, _css = get_widget_esm_css("trrack")

    trrack = traitlets.Unicode("").tag(sync=True)
    interactions = traitlets.List().tag(sync=True)

    cell_id = traitlets.Unicode("").tag(sync=True)
