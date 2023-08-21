import pandas as pd
import json
from persist_ext.extension.apply import INDEX
from persist_ext.extension.utils import idfy_dataframe
from sklearn.utils._testing import ignore_warnings
from persist_ext.extension.intent_inference import compute_predictions


def predict(data, selections, id_col, features = []):
    df = pd.read_json(data)

    features = json.loads(features)

    if len(features) == 0:
        features = list(df.columns)

    df = df[features]


    with ignore_warnings():
        preds = compute_predictions(df, selections, features, id_col)

    preds_df = pd.read_json(json.dumps(preds))

    return preds_df.T.to_json()
