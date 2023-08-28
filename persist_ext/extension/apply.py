import pandas as pd
from persist_ext.extension.interactions import ApplyInteractions
from persist_ext.extension.utils import idfy_dataframe
from IPython.display import display, JSON, HTML


from .display_utils import send_to_nb

import json

INDEX = "index"

def _apply(data, interactions, id_col = INDEX, for_apply = False):
    interactions = json.loads(interactions)

    df = pd.read_json(data)

    if not id_col:
        id_col = INDEX

    df = idfy_dataframe(df, id_col)

    app_object = ApplyInteractions(df, interactions, id_col, for_apply).apply()

    return app_object

def create_dataframe(data, interactions, id_col):
    data = _apply(data, interactions, id_col).data

    if id_col in data:
        data = data.drop(columns=[id_col])

    if "index" in data:
        data = data.drop(columns=["index"])

    if "__row_id__" in data:
        data = data.drop(columns=["__row_id__"])

    return data

def get_selections(data, interactions, id_col):
    return send_to_nb(_apply(data, interactions, id_col).selections())

def get_pts_status(data, interactions, id_col):
    return send_to_nb(_apply(data, interactions, id_col, for_apply=True).point_statuses)

def get_dataframe(data, interactions, id_col):
    return display(JSON(_apply(data, interactions, id_col).data.to_json(orient='records')))
