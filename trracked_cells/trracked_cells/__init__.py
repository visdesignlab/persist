import altair as alt
import panel as pn

from .handlers import setup_handlers

old_chart = alt.Chart

old_repr_mimebundle = old_chart._repr_mimebundle_


def new_repr_mimebundle(self, include=None, exclude=None):
    bun = old_repr_mimebundle(self, include, exclude)
    bun["application/vnd"] = "twitter"
    return (bun, {"msg": "Hello, world"})


old_chart._repr_mimebundle_ = new_repr_mimebundle


def new_chart(*args, **kwargs):
    print("Testing")

    ch = old_chart(*args, **kwargs)
    return ch


if not hasattr(alt, "isMod"):
    alt.Chart = new_chart
    alt.isMod = True


def init():
    pn.extension("vega")  # type: ignore


print("Trracking cells now!")
init()


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
