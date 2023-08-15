SELECTED = "__selected"
AGGREGATE = "__aggregate"
PREV_COLUMN_NAME = "prevColumnName"
NEW_COLUMN_NAME = "newColumnName"
COLUMN_NAMES = "columnNames"


def create_dataframe(data, interactions, base_cols = []):
    import pandas as pd
    import json

    interactions = json.loads(interactions)

    
    df = pd.read_json(data)

    df = _process(df, interactions)

    return df

def _process(df, interactions):
    sel_names = []

    for interaction in interactions:
        if interaction["type"] == 'create':
            df = df
        elif interaction["type"] == 'selection':
            if interaction['name'] not in sel_names:
                sel_names.append(interaction["name"])
            df = _apply_selection(df, interaction)
        elif interaction["type"] == "filter":
            df = get_selected(df, sel_names, True)
            sel_names = []
            df = _apply_filter(df, interaction)
        elif interaction["type"] == 'aggregate':
            df = get_selected(df, sel_names, True)
            sel_names = []
            df = _apply_aggregate(df, interaction)
        elif interaction["type"] == 'categorize':
            df = get_selected(df, sel_names, True)
            sel_names = []
            df = _apply_category(df, interaction)
        elif interaction["type"] == 'rename-column':
            df = _apply_rename_column(df, interaction)
        elif interaction["type"] == 'drop-columns':
            df = _apply_drop_columns(df, interaction)
        else: 
            print("--------------------", interaction["type"])
    df = get_selected(df, sel_names, True)

    return df

def get_selected(df, sel_names, drop=True):
    df[SELECTED] = False
    df[SELECTED] = df[sel_names].any(axis=1)

    if drop:
        df = df.drop(columns=sel_names)

    return df


def _apply_selection(df, interaction):
    new_df = df

    selection_type = interaction["select"]["type"]
    name = interaction['name']

    if not interaction['value']:
        new_df[name] = False
    if selection_type == 'point':
        new_df = _apply_point_selection(df, interaction["value"], name)
    elif selection_type == 'interval':
        new_df = _apply_interval_selection(df, interaction["value"], name)
    else:
        print("########", interaction)
    return new_df

def _apply_point_selection(df, value, name):
    df[name] = True

    print(value)
    for sel_val in value:
        for k,v in sel_val.items():
            existing = df[name]
            newMask = df[k] == v
            df[name] = existing | newMask

    return df

# can handle only dicts?
def _apply_interval_selection(df, selection, name):
    df[name] = True

    for sel_key, _range in selection.items():
        if len(_range) == 2 and (type(_range[0]) == int or type(_range[0]) == float)  and type(_range[1]) == int or type(_range[1]) == float:
            existing = df[name]
            newMask = df[sel_key].between(_range[0], _range[1])

            df[name] = existing & newMask
        else:
            existing = df[name]
            newMask = df[sel_key].apply(lambda x: any([k in x for k in _range]))

            df[name] = existing & newMask
    return df

def _apply_drop_columns(df, interaction):
    column_names = interaction[COLUMN_NAMES]

    df = df.drop(column_names, axis=1) 

    return df

def _apply_rename_column(df, interaction):
    prev_column_name = interaction[PREV_COLUMN_NAME]
    new_column_name = interaction[NEW_COLUMN_NAME]

    rename_dict = {}
    rename_dict[prev_column_name] = new_column_name

    df = df.rename(columns=rename_dict)

    return df


def _apply_aggregate(df, interaction):
    name = interaction["agg_name"]

    df = df.copy()
    if AGGREGATE not in df:
        df.loc[:, AGGREGATE] = "None"
    df.loc[df[SELECTED], AGGREGATE] = name
    df = df.drop(columns=[SELECTED])

    return df

def _apply_category(df, interaction):
    name = interaction["categoryName"]
    option = interaction["selectedOption"]

    if name not in df:
        df.loc[:, name] = "None"

    df.loc[df[SELECTED] == True, name] = option

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
