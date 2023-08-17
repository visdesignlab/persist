import pandas as pd
from persist_ext.extension.interactions import ApplyInteractions

from .display_utils import send_to_nb

import json

INDEX = "index"

def _apply(data, interactions, id_col = INDEX):
    interactions = json.loads(interactions)

    df = pd.read_json(data)

    if not id_col:
        id_col = INDEX

    if id_col not in df.columns:
        df = df.reset_index(names = id_col)
        

    app_object = ApplyInteractions(df, interactions).apply()

    return app_object

def create_dataframe(data, interactions, id_col):
    return _apply(data, interactions, id_col).data

def get_selections(data, interactions, id_col):
    return _apply(data, interactions, id_col).selections().tolist()
