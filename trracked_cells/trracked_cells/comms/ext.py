# type: ignore
import sys
from io import StringIO

import param
from ipykernel.comm import Comm as IPyComm
from IPython.display import publish_display_data

from .manager import JupyterCommManager

TRRACK_PROXY = """
if ((window.Trrack === undefined) || (window.Trrack instanceof HTMLElement)) {
  window.Trrack = {comms: {}, comm_status:{}, kernels:{}, receivers: {}, plot_index: []}
}
"""


class Extension:
    def __init__(self):
        publish_display_data(
            data={
                "application/javascript": f"{TRRACK_PROXY}\n{JupyterCommManager.js_manager}",
                "application/vnd.holoviews_load.v0+json": f"{TRRACK_PROXY}\n{JupyterCommManager.js_manager}",
            }
        )
