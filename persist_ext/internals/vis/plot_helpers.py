import altair as alt

from persist_ext.internals.dataframe.validate import is_dataframe_or_url


def base_altair_plot(data):
    data = is_dataframe_or_url(data)

    chart = alt.Chart(data)

    return chart
