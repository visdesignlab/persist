import altair as alt
from persist_ext.internals.data.idfy import ID_COLUMN

from persist_ext.internals.plot.plot_helpers import base_altair_plot
from persist_ext.internals.widgets.persist_output.wrappers import PersistChart
from persist_ext.internals.widgets.vegalite_chart.utils import is_quantitative


def barchart(
    data,
    x,
    y,
    bin=None,
    orientation="vertical",
    selection_type="point",
    color=alt.value("steelblue"),
    opacity=alt.value(1),
    encodings=None,
    fields=None,
    height=300,
    width=400,
    id_column=ID_COLUMN,
    df_name=None,
    **kwargs,
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

    barchart_non_agg_axis = "x"

    if orientation == "horizontal":
        barchart_non_agg_axis = "y"

    if bin == "y":
        y = alt.Y(y).bin()
    elif bin:
        x = alt.X(x).bin()

    chart = chart.encode(x=x, y=y, **kwargs)

    encodings = [barchart_non_agg_axis]

    x_encode = chart.encoding.x.to_dict()
    y_encode = chart.encoding.y.to_dict()

    is_binned = False
    is_time_unit = False

    if barchart_non_agg_axis == "x":
        is_binned = "bin" in x_encode
        is_time_unit = "timeUnit" in x_encode
    elif barchart_non_agg_axis == "y":
        is_time_unit = "timeUnit" in y_encode
        is_binned = "bin" in y_encode

    is_binned_or_time_unit = is_binned or is_time_unit

    selection = None

    if is_binned and selection_type == "point":
        raise ValueError("Point selections for binned axis not supported")

    args_brs = dict()

    if encodings:
        args_brs["encodings"] = encodings
    elif fields:
        args_brs["fields"] = fields
    else:
        if selection_type == "point":
            raise ValueError("Provide atleast one field projection for point selection")
        args_brs["encodings"] = ["x", "y"]

    if selection_type == "point":
        selection = alt.selection_point(name="selector", **args_brs)
    else:
        selection = alt.selection_interval(
            name="selector", **args_brs, views=["base_chart"]
        )

    if selection_type == "interval" and is_binned_or_time_unit:
        filtered_layer = chart.transform_filter(selection).encode(color=color)
        chart.name = "base_chart"
        chart = chart.encode(color=alt.value("gray"), opacity=opacity)
        chart = chart.add_params(selection)
        chart = chart + filtered_layer
    else:
        chart = chart.add_params(selection)
        chart = chart.encode(color=alt.condition(selection, color, alt.value("gray")))

    return PersistChart(chart=chart, data=data, df_name=df_name)
