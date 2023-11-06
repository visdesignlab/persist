import anywidget
import traitlets

from persist_ext.internals.utils.entry_paths import get_widget_esm_css
from persist_ext.internals.widgets.base.base_anywidget import BaseAnyWidget
from persist_ext.internals.widgets.base.base_output_object import OutputObject


class WidgetWithTrrack(BaseAnyWidget):
    """
    Add traitlets for Trrack and interactions.

    _trrack_ is a dict of the Trrack JSON for the cell
    _interactions_ are list of interactions from `root` to `current`
    """

    trrack = traitlets.Dict().tag(sync=True)

    def __init__(self, *args, **kwargs):
        self.output: OutputObject
        super(WidgetWithTrrack, self).__init__(*args, **kwargs)


class _WidgetWithTrrack(anywidget.AnyWidget):
    # For tracking generated datasets
    generated_dataframe_record = traitlets.Dict(default_value=dict()).tag(
        sync=True,
    )
    generate_dataframe_signal = traitlets.Dict({}).tag(sync=True)

    def __init__(self, widget_key=None, *args, **kwargs):
        if widget_key is None:
            raise ValueError("widget_key cannot be none")

        esm, css = get_widget_esm_css(widget_key)
        self._esm = esm
        self._css = css

        if type(self) is WidgetWithTrrack:
            raise NotImplementedError("Cannot create instance of this base class")

        super(WidgetWithTrrack, self).__init__(*args, **kwargs)
