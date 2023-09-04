import anywidget
import traitlets
from IPython.display import Javascript, display
from lzstring import LZString
from traitlets.traitlets import Unicode, validate

from persist_ext.utils.entry_paths import get_widget_esm_css

lz = LZString()


class TrrackWidget(anywidget.AnyWidget):
    _esm, _css = get_widget_esm_css("trrack")

    value = traitlets.Int(2).tag(sync=True)
    trrack = Unicode("").tag(sync=True)

    @validate("trrack")
    def _compress_trrack(self, proposal):
        graph = proposal['value']
        graph = lz.compress(graph)
        return graph

    def test(self):
        cell_id = None
        try:
            cell_id = Javascript(
                '''
                    const cell = IPython.notebook.get_selected_cell();
                    console.log(cell)
                       '''
            )
        except Exception as e:
            cell_id = None

        print("Hi", cell_id)
        return cell_id
