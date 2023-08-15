SELECTED = "__selected"

def get_selections(data, interactions):
    import pandas as pd
    import json

    interactions = json.loads(interactions)
    
    df = pd.read_json(data)
    df.reset_index(inplace=True)

    sel_cols = []

    for interaction in interactions:
        if interaction["type"] == 'selection':
            df = _apply_selection(df, interaction)
            sel_cols.append(interaction['name'])
        elif interaction["type"] == "invert-selection":
            df = df
        elif interaction["type"] == 'intent':
            df = df


    df[SELECTED] = df[sel_cols].any(axis=1)

    return ",".join(df[df[SELECTED] == True].index.astype('str').tolist())

def _apply_selection(df, interaction):
    new_df = df

    selection_type = interaction["select"]["type"]
    name = interaction['name']

    if not interaction['value']:
        new_df[name] = False
    elif selection_type == 'point':
        new_df = _apply_point_selection(df, interaction["value"], name)
    elif selection_type == 'interval':
        new_df = _apply_interval_selection(df, interaction["value"], name)
    else:
        print("########", interaction)
    return new_df

def _apply_point_selection(df, value, name):
    df[name] = True

    for sel_val in value:
        for k,v in sel_val.items():
            existing = df[name]
            newMask = df[k] == v
            print(newMask)
            df[name] = existing & newMask
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
