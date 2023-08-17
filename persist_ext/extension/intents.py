import pandas as pd
import json
from persist_ext.extension.apply import get_selections
from sklearn.utils._testing import ignore_warnings
from intent_inference import compute_predictions


def predict(data, interactions, id_col, features = []):
    selections = get_selections(data, interactions, id_col)

    df = pd.read_json(data)

    features = json.loads(features)

    if len(features) == 0:
        features = list(df.columns)

    df = df[features]

    if id_col not in df.columns:
        df = df.reset_index(names = id_col)

    with ignore_warnings():
        preds = compute_predictions(df, selections, features, row_id_label='id')

    preds_df = pd.read_json(json.dumps(preds))

    return preds_df.T.to_json()
