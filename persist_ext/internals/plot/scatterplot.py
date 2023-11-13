import altair as alt
from persist_ext.internals.data.idfy import ID_COLUMN

from persist_ext.internals.plot.plot_helpers import base_altair_plot

from persist_ext.internals.widgets.persist_output.wrappers import PersistChart


def scatterplot(
    data,
    x,
    y,
    color=alt.value("steelblue"),
    opacity=alt.value(0.8),
    circle=False,
    selection_type="interval",
    encodings=None,
    fields=None,
    height=400,
    width=400,
    id_column=ID_COLUMN,
):
    """
    Args:
        data (): url to a altair compatible dataset or a pandas dataframe
        x (): field to encode for x axis; can also be a altair axis object
        y (): field to encode for y axis; can also be a ltair axis object
        interaction (): enable 2d brush interactions
    Raises:
        TypeError: if data is not a url string or a dataframe

    Returns:
        altair chart object
    """
    chart, data = base_altair_plot(
        data, height=height, width=width, id_column=id_column
    )

    if circle:
        chart = chart.mark_circle()
    else:
        chart = chart.mark_point()

    chart = chart.encode(x=x, y=y)

    if color:
        chart.encode(color=color)

    selection = None

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
        selection = alt.selection_interval(name="selector", **args_brs)

    chart = chart.add_params(selection)

    chart = chart.encode(color=alt.condition(selection, color, alt.value("gray")))

    chart = chart.encode(opacity=alt.condition(selection, opacity, alt.value(0.3)))

    return PersistChart(chart=chart, data=data)
