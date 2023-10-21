import ipywidgets as widgets
import traitlets
from ipywidgets import HBox, VBox

from persist_ext.internals.widgets.base.body_widget_base import BodyWidgetBase
from persist_ext.internals.widgets.header.header_widget import HeaderWidget
from persist_ext.internals.widgets.intent.intent_widget import IntentWidget
from persist_ext.internals.widgets.trrack.trrack_widget import TrrackWidget
from persist_ext.internals.widgets.vegalite_chart.vegalite_chart_widget import (
    VegaLiteChartWidget,
)


def create_linker(js=False):
    if js:
        return widgets.jslink
    else:
        return widgets.link


def link(source_widget, destination_widget, property, js=False):
    linker = create_linker(js)
    linker((source_widget, property), (destination_widget, property))


def link_multiple(source_widget, destination_widgets, property, js=False):
    for dw in destination_widgets:
        link(source_widget, dw, property, js)


"""
intent_widget

trrack_widget

header_widget

body_widget

  ┌───►
──┤
  └───►

──────►
"""


class OutputWithTrrackWidget(VBox):
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
    intent_widget = traitlets.Instance(IntentWidget).tag(
        sync=True, **widgets.widget_serialization
    )

    def __init__(self, body_widget, data):
        self._update_body(body_widget)

        self.header_widget = HeaderWidget()
        self.trrack_widget = TrrackWidget()
        self.intent_widget = IntentWidget()

        # Sync trrack graph on JS side
        #                  ┌───► body_widget
        # trrack_widget ───┤
        #                  └───► header_widget
        # This can be used to sync current, root, etc.
        link_multiple(
            self.trrack_widget,
            [self.header_widget, self.body_widget, self.intent_widget],
            "trrack",
            js=True,
        )

        # Sync interactions from root --> current over kernel side
        #                  ┌───► body_widget
        # trrack_widget ───┤
        #                  └───► header_widget
        # This can be used to sync current, root, etc.
        link_multiple(
            self.trrack_widget, [self.body_widget, self.header_widget], "interactions"
        )

        # If we are in view which can show intent, sync the intents computed over python side
        #
        # body_widget ──────► intent_widget
        #
        if isinstance(self.body_widget, VegaLiteChartWidget):
            link_multiple(
                self.body_widget,
                [self.intent_widget],
                "intents",
            )

        # Sync dataframe names over JS side
        #
        # header_widget ──────► trrack_widget
        #
        link_multiple(
            self.header_widget,
            [self.trrack_widget],
            "generated_dataframe_record",
            js=True,
        )

        # Sync selection status with trrack & header over JS
        #                ┌───► trrack_widget
        # body_widget ───┤
        #                └───► header_widget
        link_multiple(
            self.body_widget,
            [self.trrack_widget, self.header_widget],
            "df_has_selections",
            js=True,
        )

        # Sync all column names
        link_multiple(
            self.body_widget,
            [self.trrack_widget, self.header_widget],
            "df_columns",
            js=True,
        )

        # Sync values
        link_multiple(
            self.body_widget,
            [self.trrack_widget, self.header_widget],
            "df_values",
            js=True,
        )

        tabs = widgets.Tab()
        tabs.children = [self.trrack_widget, self.intent_widget]
        tabs.titles = ["Trrack", "Predictions"]

        h = HBox([self.body_widget, tabs])
        h.layout.justify_content = "space-between"

        super().__init__([self.header_widget, h])

    def _update_body(self, body_widget):
        self.body_widget = body_widget
