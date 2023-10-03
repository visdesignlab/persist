import ipywidgets as widgets
import traitlets
from ipywidgets import HBox, VBox

from persist_ext.internals.widgets.header.header_widget import HeaderWidget
from persist_ext.internals.widgets.trrack.trrack_widget import TrrackWidget
from persist_ext.internals.widgets.trrack_widget_base import BodyWidgetBase


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

        widgets.jslink((self.trrack_widget, "trrack"), (self.header_widget, "trrack"))
        widgets.jslink((self.trrack_widget, "trrack"), (self.body_widget, "trrack"))
        widgets.jslink(
            (self.trrack_widget, "interactions"), (self.body_widget, "interactions")
        )

        widgets.link(
            (self.body_widget, "df_columns"), (self.trrack_widget, "df_columns")
        )
        widgets.link((self.body_widget, "df_values"), (self.trrack_widget, "df_values"))

        widgets.link(
            (self.body_widget, "df_columns"), (self.header_widget, "df_columns")
        )
        widgets.link((self.body_widget, "df_values"), (self.header_widget, "df_values"))

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
