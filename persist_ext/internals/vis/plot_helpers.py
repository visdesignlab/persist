import altair as alt

from persist_ext.internals.data.validate import is_dataframe_or_url


def base_altair_plot(data, height, width, *args, **kwargs):
    data = is_dataframe_or_url(data)

    if data is False:
        raise ValueError(
            "data must be a valid pandas dataframe or url to a csv/json file."
        )

    chart = alt.Chart(data=data, *args, **kwargs).properties(height=height, width=width)

    return chart, data
