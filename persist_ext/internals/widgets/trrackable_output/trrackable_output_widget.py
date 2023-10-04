import ipywidgets as widgets
import traitlets
from ipywidgets import HBox, VBox

from persist_ext.internals.widgets.header.header_widget import HeaderWidget
from persist_ext.internals.widgets.trrack.trrack_widget import TrrackWidget
from persist_ext.internals.widgets.trrack_widget_base import BodyWidgetBase

def create_linker(js = False):
    if js:
        return widgets.jslink
    else:
        return widgets.link

def link(source_widget, destination_widget, property, js = False):
    linker = create_linker(js)
    linker((source_widget, property), (destination_widget, property))

def link_multiple(source_widget, destination_widgets, property, js = False):
    for dw in destination_widgets:
        link(source_widget, dw, property, js)


class TrrackableOutputWidget(VBox):
    # Maybe create a TrrackableWidget which extends from anywidget
    body_widget = traitlets.Instance(BodyWidgetBase).tag(
        sync=True, **widgets.widget_serialization
    )
    header_widget = traitlets.Instance(HeaderWidget).tag(
        sync=True, **widgets.widget_serialization
    )
    trrack_widget = traitlets.Instance(TrrackWidget).tag(
        sync=True, **widgets.widget_serialization
    )

    def __init__(self, body_widget, header_widget=None, trrack_widget=None):
        self._update_body(body_widget)

        if header_widget:
            self.header_widget = header_widget

        if trrack_widget:
            self.trrack_widget = trrack_widget

        # Sync trrack graph
        link_multiple(self.trrack_widget, [self.header_widget, self.body_widget], "trrack", js=True)

        # Sync interactions
        link_multiple(self.trrack_widget, [self.body_widget], "interactions", js=True)

        # Sync columns
        link_multiple(self.body_widget, [self.trrack_widget, self.header_widget], "df_columns")

        # Sync values
        link_multiple(self.body_widget, [self.trrack_widget, self.header_widget], "df_values")

        h = HBox([self.body_widget, self.trrack_widget])
        h.layout.justify_content = "space-between"

        super().__init__([self.header_widget, h])

    @traitlets.default("header_widget")
    def _default_header_widget(self):
        return HeaderWidget()

    @traitlets.default("trrack_widget")
    def _default_trrack_widget(self):
        return TrrackWidget()

    def _update_body(self, body_widget):
        self.body_widget = body_widget
