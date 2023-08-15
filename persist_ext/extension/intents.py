from sklearn.utils._testing import ignore_warnings

INDEX = "id"
SELECTED = "__selected"

def _process(df, interactions):
    dimensions = []
    for interaction in interactions:
        if interaction["type"] == 'create':
            df = df
        elif interaction["type"] == 'selection':
            df, dims = _apply_selection(df, interaction)
            dimensions.extend(dims)
        elif interaction["type"] == "filter":
            df = df.drop(columns=[SELECTED])
        elif interaction["type"] == 'aggregate':
            df = df.drop(columns=[SELECTED])
        elif interaction["type"] == 'categorize':
            df = df.drop(columns=[SELECTED])
        else: 
            print("--------------------", interaction["type"])

    return df, dimensions

def _apply_selection(df, interaction):
    new_df = df
    dimensions = []

    selection_type = interaction["select"]["type"]

    if selection_type == 'point':
        new_df, dims = _apply_point_selection(df, interaction["value"])
        dimensions.extend(dims)
    elif selection_type == 'interval':
        new_df, dims = _apply_interval_selection(df, interaction["value"])
        dimensions.extend(dims)
    else:
        print("########", interaction)
    return new_df, dimensions

def _apply_point_selection(df, value):
    dims = []

    print("ERROR")
    print("ERROR")

    if SELECTED not in df:
        df[SELECTED] = False

    for sel_val in value:
        for k,v in sel_val.items():
            df.loc[df[k] == v, SELECTED] = True
    return df, dims

# can handle only dicts?
def _apply_interval_selection(df, selection):
    dims =[]
    if SELECTED not in df:
        df[SELECTED] = False

    for sel_key, _range in selection.items():
        df[SELECTED] = False
        df.loc[df[sel_key].between(_range[0], _range[1]), SELECTED] = True
        dims.append(sel_key)


    return df, dims
