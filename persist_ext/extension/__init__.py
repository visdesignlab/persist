from typing import List, Union
from .apply import create_dataframe, get_selections as selections, get_pts_status as gps
from .enable_ext import enable as _enable
from .intents import predict as predict_intents


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

def load_without_plot(data):
    pass
    # import altair as alt
    # return alt.Chart(data).mark_point(opacity=0).properties(height=200, width=200)


__all__ = ["enable", "apply", "predict", "load_without_plot", "get_selections", "get_pts_status"]
