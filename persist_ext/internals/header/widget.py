import anywidget
from traitlets.traitlets import Unicode

from persist_ext.internals.utils.entry_paths import get_widget_esm_css


class HeaderWidget(anywidget.AnyWidget):
    _esm, _css = get_widget_esm_css("header")

    cell_id = Unicode("").tag(sync=True)
