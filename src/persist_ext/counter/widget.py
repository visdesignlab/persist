import anywidget
import traitlets

from persist_ext.utils.entry_paths import get_widget_esm_css


class CounterWidget(anywidget.AnyWidget):
    _esm, _css = get_widget_esm_css("counter")

    value = traitlets.Int(0).tag(sync=True)
