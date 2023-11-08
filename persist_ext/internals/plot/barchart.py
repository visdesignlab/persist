import altair as alt
from persist_ext.internals.data.idfy import ID_COLUMN

from persist_ext.internals.plot.plot_helpers import base_altair_plot
from persist_ext.internals.widgets.persist_output.wrappers import PersistChart


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
    id_column=ID_COLUMN,
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
    chart, data = base_altair_plot(
        data, height=height, width=width, id_column=id_column
    )

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

    x_encode = chart.encoding.x
    y_encode = chart.encoding.y

    is_binned = False
    is_time_unit = False

    if barchart_non_agg_axis == "x":
        is_binned = hasattr(x_encode, "bin")
        is_time_unit = hasattr(x_encode, "timeUnit")
        is_ordinal_or_nominal = hasattr(x_encode, "type") and x_encode.type in [
            "nominal",
            "ordinal",
        ]
    elif barchart_non_agg_axis == "y":
        is_binned = hasattr(y_encode, "bin")
        is_time_unit = hasattr(y_encode, "timeUnit")
        is_ordinal_or_nominal = hasattr(y_encode, "type") and y_encode.type in [
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

    return PersistChart(chart=chart, data=data)
