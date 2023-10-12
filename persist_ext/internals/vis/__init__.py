from persist_ext.internals.vis.barchart import barchart
from persist_ext.internals.vis.interactive_table import interactive_table
from persist_ext.internals.vis.scatterplot import scatterplot
from persist_ext.internals.widgets.trrackable_output.output_with_trrack_widget import (
    OutputWithTrrackWidget,
)
from persist_ext.internals.widgets.vegalite_chart.vegalite_chart_widget import (
    VegaLiteChartWidget,
)


def TrrackableChart(chart, data=None):
    data = chart.data.copy(deep=True)

    return OutputWithTrrackWidget(
        body_widget=VegaLiteChartWidget(chart=chart, data=data)
    )


__all__ = ["scatterplot", "barchart", "interactive_table", "TrrackableChart"]
