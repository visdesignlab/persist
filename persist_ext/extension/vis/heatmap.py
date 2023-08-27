
import pandas as pd
import altair as alt
from persist_ext.extension.df.validate import is_dataframe_or_url
from persist_ext.extension.vis.plot_helpers import base_altair_plot

def heatmap(data, x, y, color, interaction=True, selection_type="interval"):
    """

    Args:
        data (): 
        x (): 
        y (): 
        orientation (): horizontal | vertical
        interaction (): True | False
        _type (): point |  interval

    Raises:
        TypeError: if data is not a url string or a dataframe

    Returns:
        altair chart object
        
    """
    chart = base_altair_plot(data)

    chart = chart.mark_rect()
    chart = chart.encode(x=x, y=y, color=color)

    if not interaction:
        return chart

    encodings = ["x", "y"]

    selection = None

    if  selection_type == "point":
        selection = alt.selection_point(name="selector", encodings=encodings)
    else:
        selection = alt.selection_interval(name="selector", encodings=encodings)

    chart = chart.encode(opacity=alt.condition(selection, alt.value(1), alt.value(0.3))).add_params(selection)

    return chart
