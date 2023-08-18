from persist_ext.extension.interactions.filter import apply_filter
from persist_ext.extension.interactions.aggregate import AGGREGATE_COLUMN, apply_aggregate
from persist_ext.extension.interactions.selections import SELECTED,  apply_selection
from persist_ext.extension.interactions.categorize import  apply_category
from persist_ext.extension.interactions.label_note import  apply_label, apply_note
from persist_ext.extension.interactions.columns import  apply_rename_column
from persist_ext.extension.interactions.utils import PROCESSED, mark_as_processed


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
            self.acc_and_empty_params()
            self.data = apply_aggregate(self.data, interaction)
            self.data = mark_as_processed(self.data)
            self.data = drop_cols(self.data, [SELECTED, AGGREGATE_COLUMN])
        elif CATEGORIZE == _type:
            print(interaction)
            category_name = interaction["categoryName"]  
            selected_opt = interaction["selectedOption"]

            self.acc_and_empty_params()
            self.data = apply_category(self.data, category_name, selected_opt)
            self.data = mark_as_processed(self.data, PROCESSED + category_name)
            self.data = drop_cols(self.data, [SELECTED])
        elif LABEL == _type:
            self.acc_and_empty_params()
            self.data = apply_label(self.data, interaction["label"])
            self.data = mark_as_processed(self.data, PROCESSED)
            self.data = drop_cols(self.data, [SELECTED])
        elif NOTE == _type:
            self.acc_and_empty_params()
            self.data = apply_note(self.data, interaction["note"])
            self.data = mark_as_processed(self.data, PROCESSED)
            self.data = drop_cols(self.data, [SELECTED])
        elif RENAME_COLUMN == _type:
            prev_name = interaction["prevColumnName"]
            new_name = interaction["newColumnName"]
            self.data = apply_rename_column(self.data, prev_name, new_name)
        elif DROP_COLUMNS == _type:
            cols = interaction["columnNames"]
            if not cols:
                cols = []
            self.data = drop_cols(self.data, cols)
        else:
            print("Error", interaction)
            self.data = self.data
    
        # Post process
        print("Applied", self.applied_sels_param_names)

def accumulate_selections_and_drop_param_cols(df, applied_params):
    applied_params = list(applied_params)

    df[SELECTED] = df[applied_params].any(axis=1)


    df = df.drop(columns=applied_params)

    return df

def drop_cols(data, arr):
    return data.drop(columns=arr)

