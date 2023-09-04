from contextlib import contextmanager

import ipywidgets as widgets


@contextmanager
def widget_output():
    out = widgets.Output(layout={"border": "1px solid black"})
    return out
