import pandas as pd
import warnings
import altair as alt
from persist_ext.extension.df.validate import is_dataframe_or_url
from persist_ext.extension.vis.plot_helpers import base_altair_plot

def barchart(data, x, y, orientation="vertical", interaction=True, selection_type="interval"):
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

    chart = chart.mark_bar()
    chart = chart.encode(x=x, y=y)



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
    elif barchart_non_agg_axis == "y":
        is_time_unit = "timeUnit" in y_encode
        is_binned = "bin" in y_encode

    is_binned_or_time_unit = is_binned or is_time_unit

    selection = None

    if is_binned and selection_type == 'point':
        print("Point selections for binned axis not implemented")

    if  selection_type == "point":
        selection = alt.selection_point(name="selector", encodings=encodings)
    else:
        selection = alt.selection_interval(name="selector", encodings=encodings, views=["base_chart"])

    if is_binned_or_time_unit:
        filtered_layer = chart.transform_filter(selection)
        chart.name = "base_chart"
        chart = chart.encode(color=alt.value("gray"), opacity=alt.value(0.3))
        chart = chart.add_params(selection)
        chart = chart + filtered_layer
    else:
        chart = chart.add_params(selection)
        chart = chart.encode(color=alt.condition(selection, alt.value("steelblue"), alt.value("gray")))

    return chart
