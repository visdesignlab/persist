import altair as alt
import panel as pn
import param
from IPython.core.getipython import get_ipython

from ..constants import TRX_EXTENSION_COMM2


class Trracked(object):
    cell_id: str | None

    def __init__(self) -> None:
        print("Init Trrack")

    def chart(self, chart: alt.Chart):
        ch = pn.panel(chart, debounce=10)

        return ch

    def get_query(self, selection):
        if selection is None:
            return ""

        return " & ".join(
            f"{crange[0]:.3f} <= `{col}` <= {crange[1]:.3f}"
            for col, crange in selection.items()
        )
