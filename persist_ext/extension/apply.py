SELECTED = "__selected"
AGGREGATE = "__aggregate"
CATEGORY = "__category"


def create_dataframe(data, interactions, base_cols = []):
    import pandas as pd
    import json

    interactions = json.loads(interactions)
    
    df = pd.read_json(data)

    if len(base_cols) == 0:
        base_cols = list(df.columns)

    print(base_cols)

    df = df[base_cols]

    df = _process(df, interactions)

    return df

def _process(df, interactions):
    for interaction in interactions:
        print(interaction)
        if interaction["type"] == 'create':
            df = df
        elif interaction["type"] == 'selection':
            df = _apply_selection(df, interaction)
        elif interaction["type"] == "filter":
            df = _apply_filter(df, interaction)
        elif interaction["type"] == 'aggregate':
            df = _apply_aggregate(df, interaction)
        elif interaction["type"] == 'categorize':
            df = _apply_category(df, interaction)
        else: 
            print("--------------------", interaction["type"])
    return df

def _apply_aggregate(df, interaction):
    name = interaction["agg_name"]

    df = df.copy()
    df.loc[:, AGGREGATE] = "None"
    df.loc[df[SELECTED], AGGREGATE] = name
    df = df.drop(columns=[SELECTED])

    return df

def _apply_category(df, interaction):
    name = interaction["cat_name"]

    df = df.copy()
    df.loc[:, CATEGORY] = "None"
    df.loc[df[SELECTED], CATEGORY] = name
    df = df.drop(columns=[SELECTED])

    return df

def _apply_filter(df, interaction):
    filter_out = interaction["direction"] == 'out'

    if filter_out:
        df = df[df[SELECTED] == False]
    else:
        df = df[df[SELECTED] == True]

    df = df.drop(columns=[SELECTED])
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
