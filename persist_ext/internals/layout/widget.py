from ipywidgets import HBox, VBox, jslink

from persist_ext.internals.body.widget import BodyWidget
from persist_ext.internals.header.widget import HeaderWidget
from persist_ext.internals.trrack.widget import TrrackWidget


# wrap in BodyWidget
def TrrackableOutputLayout(body_widget):
    header = HeaderWidget()
    body = body_widget
    trrack = TrrackWidget()

    h = HBox([body, trrack])
    h.layout.justify_content = "space-between"
    v = VBox([header, h])

    return v
