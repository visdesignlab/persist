import pandas as pd
from persist_ext.extension.interactions import ApplyInteractions
from persist_ext.extension.utils import idfy_dataframe

from .display_utils import send_to_nb

import json

INDEX = "index"

def _apply(data, interactions, id_col = INDEX):
    interactions = json.loads(interactions)

    df = pd.read_json(data)

    if not id_col:
        id_col = INDEX

    df = idfy_dataframe(df, id_col)

    app_object = ApplyInteractions(df, interactions, id_col).apply()

    return app_object

def create_dataframe(data, interactions, id_col):
    return _apply(data, interactions, id_col).data

def get_selections(data, interactions, id_col):
    return send_to_nb(_apply(data, interactions, id_col).selections())
