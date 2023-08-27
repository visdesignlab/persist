from typing import List, Union

from persist_ext.extension.display_utils import send_to_nb
from .apply import create_dataframe, get_selections as selections, get_pts_status as gps, get_dataframe as gdf
from .enable_ext import enable as _enable
from .intents import predict as predict_intents
from IPython.display import display, publish_display_data

def create_interactive_table(data): 
    return publish_display_data({"application/vnd.vega.v5+json": data.to_json()}, metadata={"dataframeOnly": True})

def enable(enable_for: Union[str, List[str]] = []):
    return _enable(enable_for)

def apply(data, interactions, id_col = None):
    return create_dataframe(data, interactions, id_col)

def get_selections(data, interactions, id_col = None):
    return selections(data, interactions, id_col)

def predict(data, selections, id_col = None,  features = []):
    return predict_intents(data, selections, id_col, features)

def get_pts_status(data, interactions, id_col = None):
    return gps(data, interactions, id_col)

def get_dataframe(data, interactions, id_col = None):
    return gdf(data, interactions, id_col)

def load_without_plot(data):
    pass
    # import altair as alt
    # return alt.Chart(data).mark_point(opacity=0).properties(height=200, width=200)


__all__ = ["enable", "apply", "predict", "load_without_plot", "get_selections", "get_pts_status", "create_interactive_table", "get_dataframe"]
