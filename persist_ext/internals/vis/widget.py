# Link to jonmmease branch! Thanks!
import anywidget
from altair import TopLevelSpec
from IPython.display import HTML, display
from traitlets import traitlets

from persist_ext.internals.utils.entry_paths import get_widget_esm_css


class VegaLiteChartWidget(anywidget.AnyWidget):
    _esm, _css = get_widget_esm_css("vegalite")

    cell_id = traitlets.Unicode("").tag(sync=True)

    chart = traitlets.Instance(TopLevelSpec)
    spec = traitlets.Dict().tag(sync=True)

    def __init__(self, chart) -> None:
        super().__init__(chart=chart)

    @traitlets.observe("chart")
    def _on_chart_change(self, change):
        new_chart = change.new

        with self.hold_sync():
            self.spec = new_chart.to_dict()
