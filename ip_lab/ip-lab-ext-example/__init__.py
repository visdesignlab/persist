import json 

from ._version import __version__
from pathlib import Path

from .handlers import setup_handlers

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "ip_lab"
    }]

def _jupyter_server_extension_points():
    return [{
        "module": "ip-lab-ext-example",
    }]

def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.
    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    url_path =  "ip-lab-ext-example"
    setup_handlers(server_app.web_app, url_path)
    server_app.log.info(
        f"Registered jlab_ext_example extension at URL path /{url_path}"
    )

load_jupyter_server_extension = _load_jupyter_server_extension