from typing import Any

import panel as pn
from ipykernel.comm import Comm

from ._version import __version__
from .comms.ext import Extension
from .handlers import setup_handlers


def init():
    pn.extension("vega")  # type: ignore
    extension = Extension()


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "trracked_cells"}]


def _jupyter_server_extension_points():
    return [{"module": "trracked_cells"}]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    name = "trracked_cells"
    server_app.log.info(f"Registered {name} server extension")


# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension
