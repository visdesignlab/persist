import pandas as pd
import altair as alt
from persist_ext.extension.df.validate import is_dataframe_or_url
from persist_ext.extension.vis.plot_helpers import base_altair_plot

def linechart(data, x, y, color=None, color_str=None, highlight=True, selectable=True):
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

    base = base_altair_plot(data)

    base = base.encode(x=x, y=y).mark_line()

    if color:
        base = base.encode(color=color)

    lines = base.mark_line()

    if not highlight and not selectable:
        return lines

    if not color_str and isinstance(color, str):
        if ":N" in color:
            color_str = color.replace(":N", "")
        else:
            color_str = color
    else:
        raise ValueError("Please specify the name of the column encoded as `color`")

    highlight = alt.selection_point(on="mouseover", fields=[color_str], nearest=True)

    points = base.mark_circle().encode(
            opacity=alt.value(0)
            ).add_params(highlight)

    lines = lines.encode(size=alt.condition(~highlight, alt.value(1), alt.value(3)))

    return lines + points
