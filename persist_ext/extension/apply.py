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

    if len(base_cols) == 0:
        base_cols = list(df.columns)


    df = df[base_cols]

    df = _process(df, interactions)

    return df

def _process(df, interactions):
    for interaction in interactions:
        if interaction["type"] == 'create':
            df = df
        elif interaction["type"] == 'selection':
            df = _apply_selection(df, interaction)
        elif interaction["type"] == "filter":
            df = _apply_filter(df, interaction)
        elif interaction["type"] == "sort":
            df = _apply_sort(df, interaction)
        elif interaction["type"] == 'aggregate':
            df = _apply_aggregate(df, interaction)
        elif interaction["type"] == 'categorize':
            df = _apply_category(df, interaction)
        elif interaction["type"] == 'rename-column':
            df = _apply_rename_column(df, interaction)
        elif interaction["type"] == 'drop-columns':
            df = _apply_drop_columns(df, interaction)
        else: 
            print("--------------------", interaction["type"])
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

def _apply_sort(df, interaction):
    direction = interaction["direction"]
    col = interaction["col"]

    df = df.copy()
    df = df.sort_values(col, ascending=(direction == 'ascending'))

    return df

def _apply_category(df, interaction):
    name = interaction["categoryName"]
    option = interaction["selectedOption"]

    df = df.copy()
    if name not in df:
        df.loc[:, name] = "None"
    df.loc[df[SELECTED], name] = option
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
