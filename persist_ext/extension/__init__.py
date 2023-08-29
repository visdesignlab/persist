from typing import List, Union
import json

from IPython.display import display, publish_display_data

from persist_ext.extension.display_utils import send_to_nb

from . import vis
import pandas as pd
from .apply import INDEX, create_dataframe, create_groupby_dataframe
from .apply import get_dataframe as gdf
from .apply import get_pts_status as gps
from .apply import get_selections as selections
from .enable_ext import enable as _enable
from .intents import predict as predict_intents


def create_interactive_table(data): 
    return publish_display_data({"application/vnd.vega.v5+json": data.to_json(orient='records')}, metadata={"dataframeOnly": True})

def enable(enable_for: Union[str, List[str]] = []):
    return _enable(enable_for)

def apply(data, interactions, id_col = INDEX, groupby = None, groupby_args = "count"):
    if not groupby:
        return create_dataframe(data, interactions, id_col)
    else:
        groupby_args = json.loads(groupby_args)
        return create_groupby_dataframe(data, interactions, id_col, groupby, groupby_args)

def get_selections(data, interactions, id_col = INDEX):
    return selections(data, interactions, id_col)

def predict(data, selections, id_col = INDEX,  features = []):
    return predict_intents(data, selections, id_col, features)

def get_pts_status(data, interactions, id_col = INDEX):
    return gps(data, interactions, id_col)

def get_dataframe(data, interactions, id_col = None):
    return gdf(data, interactions, id_col)

def get_dtypes(data):
    data = pd.read_json(data)
    return send_to_nb({k: str(v) for k,v in data.dtypes.to_dict().items()})

def load_without_plot(data):
    pass
    # import altair as alt
    # return alt.Chart(data).mark_point(opacity=0).properties(height=200, width=200)


__all__ = ["enable", "apply", "predict", "load_without_plot", "get_selections", "get_pts_status", "create_interactive_table", "get_dataframe", "vis", "get_dtypes"]
