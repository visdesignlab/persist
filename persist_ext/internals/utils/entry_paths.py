import pathlib

from persist_ext.internals.utils.dev import DEV

# Path of static folder. Update in vite.config.js as well
bundler_output_dir = pathlib.Path(__file__).parent.parent.parent / "static"
# Path of server
DEV_BASE = "http://localhost:5173/"


def get_widget_esm_css(widget_folder_name, widget_name=None):
    """Returns the esm(js) and css path built by vite

    Args:
        widget_name: Name of the widget for which to get the ESM & CSS paths

    Returns:
        Tuple of _ESM path and _CSS path

    """
    if widget_name is None:
        widget_name = widget_folder_name

    if DEV:
        _ESM = (
            DEV_BASE + f"src/widgets/{widget_folder_name}/{widget_name}.tsx?anywidget"
        )
        _CSS = ""
    else:
        _ESM = bundler_output_dir / f"{widget_folder_name}/index.mjs"
        _CSS = bundler_output_dir / "style.css"

    return _ESM, _CSS
