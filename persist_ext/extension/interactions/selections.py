SELECTED = "__selected"



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
