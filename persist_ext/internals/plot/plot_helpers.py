import altair as alt
from persist_ext.internals.data.prepare import prepare


def base_altair_plot(data, height, width, id_column, *args, **kwargs):
    data = prepare(data, id_column)

    if data is False:
        raise ValueError(
            "data must be a valid pandas dataframe or url to a csv/json file."
        )

    chart = alt.Chart(data=data, *args, **kwargs).properties(height=height, width=width)

    return chart, data
