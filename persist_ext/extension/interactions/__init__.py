from persist_ext.extension.interactions.filter import apply_filter
from persist_ext.extension.interactions.selections import apply_selection, SELECTED


CREATE = "create"
SELECTION = 'selection'
INVERT_SELECTION = "invert-selection"
FILTER = "filter"
AGGREGATE = "aggregate"
CATEGORIZE = "categorize"
LABEL = "label"
NOTE = "note"
RENAME_COLUMN = "rename-column" 
DROP_COLUMNS = "drop-columns"
INTENT = "intent"


class ApplyInteractions:
    def __init__(self, data, interactions = []):
        self.data = data
        self.interactions = interactions
        self.applied_sels_param_names = set()

    def apply(self):
        last_applied_interaction = None

        for interaction in self.interactions:
            self.apply_interaction(interaction)
            last_applied_interaction = interaction["type"]

        if last_applied_interaction == SELECTION:
            self.acc_and_empty_params()

        return self

    def acc_and_empty_params(self):
        self.data = accumulate_selections_and_drop_param_cols(self.data, self.applied_sels_param_names)
        self.applied_sels_param_names.clear()

    def selections(self):
        return self.data[self.data[SELECTED]]["index"]

    def apply_interaction(self, interaction):
        _type = interaction["type"]
        print("####################")
        print(_type)

        if CREATE == _type:
            self.data = self.data
        elif SELECTION == _type:
            param_name = interaction["name"]

            self.applied_sels_param_names.add(param_name)
            self.data = apply_selection(self.data, interaction)
        elif INVERT_SELECTION == _type:
            self.data = self.data
        elif INTENT == _type:
            self.data = self.data
        elif FILTER == _type:
            self.acc_and_empty_params()
            self.data = apply_filter(self.data, interaction)
            self.data = drop_cols(self.data, [SELECTED])
        elif AGGREGATE == _type:
            self.data = self.data
        elif CATEGORIZE == _type:
            self.data = self.data
        elif LABEL == _type:
            self.data = self.data
        elif NOTE == _type:
            self.data = self.data
        elif RENAME_COLUMN == _type:
            self.data = self.data
        elif DROP_COLUMNS == _type:
            self.data = self.data
        else:
            print("Error", interaction)
            self.data = self.data
    
        print("Applied", self.applied_sels_param_names)

def accumulate_selections_and_drop_param_cols(df, applied_params):
    applied_params = list(applied_params)

    df[SELECTED] = df[applied_params].any(axis=1)


    df = df.drop(columns=applied_params)

    return df

def drop_cols(data, arr):
    return data.drop(columns=arr)
