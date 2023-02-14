import altair as alt
import panel as pn
import param
from ipykernel.comm import Comm
from IPython.core.getipython import get_ipython

from .uicomm import UIComm


class Trracked(object):
    cell_id: str | None

    def __init__(self) -> None:
        print("Init Trrack")
        comm = Comm(target_name="trracked_cells")
        self.comm = comm

    def chart(self, chart: alt.Chart):
        print(Trracked.cell_id)
        ch = pn.panel(chart, debounce=10)

        self.comm.send({"cellId": Trracked.cell_id})

        @param.depends(ch.selection.param.brush, watch=True)
        def pr(a):
            if self.comm:
                self.comm.send({"cellId": Trracked.cell_id, "a": a})

        return ch

    def get_query(self, selection):
        if selection is None:
            return ""

        return " & ".join(
            f"{crange[0]:.3f} <= `{col}` <= {crange[1]:.3f}"
            for col, crange in selection.items()
        )
