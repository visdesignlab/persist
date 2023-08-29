import altair as alt
from persist_ext.extension.df.validate import is_dataframe_or_url


def base_altair_plot(data):
    if not is_dataframe_or_url(data):
        raise TypeError("Data must be a url string OR a pandas dataframe") 

    chart = alt.Chart(data)
    
    return chart
