import json
import pathlib

from persist_ext.internals.utils.dev import DEV

root_path = pathlib.Path(__file__).parent.parent.parent

with open(root_path / "internals/widgets/widget_map.json") as f:
    widget_name_map = json.loads(f.read())


with open(root_path / "internals/widgets/basepaths.json") as f:
    basepaths = json.loads(f.read())
    output_dir = pathlib.Path(basepaths["outputBaseDir"])
    src_base_dir = pathlib.Path(basepaths["srcBaseDir"])


# Path of static folder. Update in vite.config.js as well
bundler_output_dir = root_path / "static"
# Path of server
DEV_BASE = "http://localhost:5173"


def get_widget_esm_css(key):
    """Returns the esm(js) and css path built by vite

    Args:
        widget_name: Name of the widget for which to get the ESM & CSS paths

    Returns:
        Tuple of _ESM path and _CSS path

    """

    widget = widget_name_map[key]
    _CSS = ""

    if DEV:
        _ESM = (
            DEV_BASE
            + f"/{ src_base_dir }/{widget['dir']}/{(widget['srcFileName'] + '?anywidget')}"
        )
    else:
        _ESM = (bundler_output_dir / widget["fileName"]).read_text()

    return _ESM, _CSS
