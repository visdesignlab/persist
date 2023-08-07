from intent_inference import compute_predictions

INDEX = "index"
SELECTED = "__selected"

def predict(data, interactions, features=[] ):
    import pandas as pd
    import json

    interactions = json.loads(interactions)
    
    df = pd.read_json(data)

    if len(features) == 0:
        features = list(df.columns)

    df = df[features]

    df.reset_index(inplace=True)

    df = _process(df, interactions)

    selections = df.loc[df[SELECTED] == True][INDEX].tolist()

    # preds = compute_predictions(data, ["Horsepower", "Miles_per_Gallon"], selections)

    print(selections)

    return df[SELECTED].to_json()

def _process(df, interactions):
    for interaction in interactions:
        if interaction["type"] == 'create':
            df = df
        elif interaction["type"] == 'selection':
            df = _apply_selection(df, interaction)
        elif interaction["type"] == "filter":
            df = df.drop(columns=[SELECTED])
        elif interaction["type"] == 'aggregate':
            df = df.drop(columns=[SELECTED])
        elif interaction["type"] == 'categorize':
            df = df.drop(columns=[SELECTED])
        else: 
            print("--------------------", interaction["type"])
    return df

def _apply_selection(df, interaction):
    new_df = df

    selection_type = interaction["select"]["type"]

    if selection_type == 'point':
        new_df = _apply_point_selection(df, interaction["value"])
    elif selection_type == 'interval':
        new_df = _apply_interval_selection(df, interaction["value"])
    else:
        print("########", interaction)
    return new_df

def _apply_point_selection(df, value):
    if SELECTED not in df:
        df[SELECTED] = False

    for sel_val in value:
        for k,v in sel_val.items():
            df.loc[df[k] == v, SELECTED] = True
    return df

# can handle only dicts?
def _apply_interval_selection(df, selection):
    if SELECTED not in df:
        df[SELECTED] = False

    for sel_key, _range in selection.items():
        df[SELECTED] = False
        df.loc[df[sel_key].between(_range[0], _range[1]), SELECTED] = True

    return df
