from sklearn.utils._testing import ignore_warnings
from intent_inference import compute_predictions

INDEX = "id"
SELECTED = "__selected"

def predict(data, selections, features):
    import pandas as pd
    import json
    
    df = pd.read_json(data)


    selections = json.loads(selections)
    features = json.loads(features)

    if len(features) == 0:
        features = list(df.columns)

    df = df[features]

    df['id'] = df.index.map(str)

    with ignore_warnings():
        preds = compute_predictions(df, selections, features, row_id_label='id')

    preds_df = pd.read_json(json.dumps(preds))

    return preds_df.T.to_json()
