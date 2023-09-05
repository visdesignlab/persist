from ipywidgets import HBox, VBox, jslink

from persist_ext.internals.body.widget import BodyWidget
from persist_ext.internals.header.widget import HeaderWidget
from persist_ext.internals.trrack.widget import TrrackWidget


def TrrackableOutput():
    header = HeaderWidget()
    body = BodyWidget()
    trrack = TrrackWidget()

    h = HBox([body, trrack])
    h.layout.justify_content = "space-between"
    v = VBox([header, h])

    return v
