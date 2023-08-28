from intent_inference import apply_prediction
from sklearn.utils._testing import ignore_warnings

SELECTED = "__selected"

INTENT_SELECTED = "__intent_selected"

INVERT_SELECTED = "__invert_selected"

def apply_intent_selection(df, intent, row_id_label):
    with ignore_warnings():
        newPredObj = apply_prediction(df, intent, row_id_label) 

    
    df[SELECTED] = False

    df[INTENT_SELECTED] = False
    df[INTENT_SELECTED]  = df[row_id_label].isin(newPredObj["ids"])
    return df;

def apply_invert(df):
    if SELECTED not in df:
        df[SELECTED] = False

    df[INVERT_SELECTED] = ~df[SELECTED]

    df[SELECTED] = False

    return df

def apply_sort(df, interaction):
    direction = interaction["direction"]
    col = interaction["col"]

    df = df.copy()
    df = df.sort_values(col, ascending=(direction == 'ascending'))

    return df

def apply_reorder(df, interaction):
    newcols = interaction["value"]

    df = df.copy()

    print(newcols)

    df = df[newcols]

    print(df.columns.tolist())
    return df

def apply_selection(df, interaction):
    new_df = df

    selection_type = interaction["select"]["type"]
    name = interaction['name']

    if not interaction['value']:
        new_df[name] = False
    if selection_type == 'point':
        new_df = apply_point_selection(df, interaction["value"], name)
    elif selection_type == 'interval':
        new_df = apply_interval_selection(df, interaction["value"], name)
    else:
        print("########", interaction)
    return new_df


# Point selections are always arrays
def apply_point_selection(df, value, name):
    """
         All selections are maps between field names and initial values
         
         POINT SELECTIONS
         Array of such mappings e.g:
         [
           {"Cylinders": 4, "Year": 1981},
           {"Cylinders": 8, "Year": 1972}
         ]
    """
    df[name] = False # Start with everything selected

    print("Selecting: ", value)

    for sel_val in value: # each selected "POINT" is represented by a mapping
        existing = df[name] | True  # get selected points for one set of mapping; initially everything is selected

        for k,v in sel_val.items(): # get col_name, value for each entry in mapping
            newMask = df[k] == v # get mask for each entry in the mapping
            existing = existing & newMask # update by ANDing with existing mapping

        df[name] = df[name] | existing # update the dataframe by ORing with existing

    return df # return with added [name] column

def apply_interval_selection(df, selection, name):
    """
         INTERVAL SELECTIONS
         Single object with field names and value array. e.g:

         {"x": [55, 160], "y": [13, 37]}
    """

    df[name] = True # Start with all selected

    for sel_key, _range in selection.items(): # iterate over individual key-val pair
        if len(_range) == 2 and is_number(_range[0]) and is_number(_range[1]): # if the range is 2-long and numeric use between
            existing = df[name] # get exising mask for 'name'
            newMask = df[sel_key].between(_range[0], _range[1])  # get mask between range

            df[name] = existing & newMask # and both masks
        else: # for more than 2-long use any of
            existing = df[name] # get existing mask for 'name'
            newMask = df[sel_key].apply(lambda x: any([k in x for k in _range])) # check if each value in the row in included in the range

            df[name] = existing & newMask # and both masks
    return df

def is_number(val):
    return isinstance(val, (int, float))
