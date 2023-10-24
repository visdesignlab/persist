import altair as alt

from persist_ext.internals.vis.plot_helpers import base_altair_plot
from persist_ext.internals.widgets.trrackable_output.output_with_trrack_widget import (
    OutputWithTrrackWidget,
)
from persist_ext.internals.widgets.vegalite_chart.vegalite_chart_widget import (
    VegaLiteChartWidget,
)


def barchart(
    data,
    x,
    y,
    orientation="vertical",
    color=None,
    interaction=True,
    selection_type="interval",
    height=400,
    width=400,
):
    """
    Args:
        data (): url to a altair compatible dataset or a pandas dataframe
        x (): field to encode for x axis; can also be a altair axis object
        y (): field to encode for y axis; can also be a altair axis object
        interaction (): enable 2d brush interactions
    Raises:
        TypeError: if data is not a url string or a dataframe

    Returns:
        altair chart object
    """
    chart, data = base_altair_plot(data, height=height, width=width)

    chart = chart.mark_bar()

    chart = chart.encode(x=x, y=y)

    if color:
        chart.encode(color=color)

    if not interaction:
        return chart

    barchart_non_agg_axis = "x"

    if orientation == "horizontal":
        barchart_non_agg_axis = "y"

    encodings = [barchart_non_agg_axis]

    x_encode = chart.encoding.x.to_dict()
    y_encode = chart.encoding.y.to_dict()

    is_binned = False
    is_time_unit = False

    if barchart_non_agg_axis == "x":
        is_binned = "bin" in x_encode
        is_time_unit = "timeUnit" in x_encode
        is_ordinal_or_nominal = "type" in x_encode and x_encode["type"] in [
            "nominal",
            "ordinal",
        ]
    elif barchart_non_agg_axis == "y":
        is_time_unit = "timeUnit" in y_encode
        is_binned = "bin" in y_encode
        is_ordinal_or_nominal = "type" in y_encode and y_encode["type"] in [
            "nominal",
            "ordinal",
        ]

    is_binned_or_time_unit = is_binned or is_time_unit

    selection = None
    if is_binned and selection_type == "point":
        print("Point selections for binned axis not implemented")

    if selection_type == "point":
        selection = alt.selection_point(name="selector", encodings=encodings)
    else:
        selection = alt.selection_interval(
            name="selector", encodings=encodings, views=["base_chart"]
        )

    if (
        selection_type == "interval"
        and not is_ordinal_or_nominal
        and is_binned_or_time_unit
    ):
        filtered_layer = chart.transform_filter(selection)
        chart.name = "base_chart"
        chart = chart.encode(color=alt.value("gray"), opacity=alt.value(0.3))
        chart = chart.add_params(selection)
        chart = chart + filtered_layer
    else:
        chart = chart.add_params(selection)
        chart = chart.encode(
            color=alt.condition(selection, alt.value("steelblue"), alt.value("gray"))
        )

    return OutputWithTrrackWidget(
        body_widget=VegaLiteChartWidget(chart, data=data), data=data
    )
