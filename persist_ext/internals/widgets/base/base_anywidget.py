import anywidget

from persist_ext.internals.utils.entry_paths import get_widget_esm_css


class BaseAnyWidget(anywidget.AnyWidget):
    """
    Basic anywidget setup by _esm and _css
    """

    def __init__(self, widget_key=None, *args, **kwargs):
        if widget_key is None:
            raise ValueError("widget_key cannot be none")

        esm, css = get_widget_esm_css(widget_key)
        self._esm = esm
        self._css = css

        if type(self) is BaseAnyWidget:
            raise NotImplementedError("Cannot create instance of this base class")

        super(BaseAnyWidget, self).__init__(*args, **kwargs)
