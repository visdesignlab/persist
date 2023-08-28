from persist_ext.extension.interactions.filter import FILTERED_OUT, apply_filter
from persist_ext.extension.interactions.aggregate import AGGREGATE_COLUMN, apply_aggregate
from persist_ext.extension.interactions.selections import INTENT_SELECTED, INVERT_SELECTED, SELECTED,  apply_selection, apply_intent_selection, apply_invert
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
    def __init__(self, data, interactions, row_id_label, for_apply):
        self.data = data
        self.interactions = interactions
        self.row_id_label = row_id_label
        self.applied_sels_param_names = set()
        self.for_apply = for_apply
        #
        self.processed_cols = [PROCESSED]
        self.processed = []
        self.last_selection = []

        self.point_statuses = []

        self.last_applied_interaction = None

    def apply(self):

        for interaction in self.interactions:
            self.apply_interaction(interaction)
            self.last_applied_interaction = interaction["type"]

        if self.last_applied_interaction == SELECTION or self.last_applied_interaction == INTENT:
            self.acc_and_empty_params()
        
        if not self.for_apply:
            if FILTERED_OUT in self.data:
                self.data = self.data[~self.data[FILTERED_OUT]]
                self.data = drop_cols(self.data, [FILTERED_OUT])
            self.data = drop_cols(self.data, self.processed_cols)
            
        
        return self

    def get_stats(self):
        sels = list(set(self.last_selection))
        processed = list(set([x for x in self.processed if x not in sels]))
            
        return {
                "processed": processed,
                "selected": sels,
        }
 

    def get_point_statuses(self):
        if self.for_apply:
            cols = [x for x in self.processed_cols if x in self.data]
            self.processed = self.data[self.data[cols].any(axis=1)][self.row_id_label].tolist()
        self.point_statuses.append(self.get_stats())


    def acc_and_empty_params(self, copy=False):
        if copy:
            data = self.data.copy(deep=True)
            data = accumulate_selections_and_drop_param_cols(data, self.applied_sels_param_names)
            return data
 
        self.data = accumulate_selections_and_drop_param_cols(self.data, self.applied_sels_param_names)
        self.applied_sels_param_names.clear()
        return self.data

    def selections(self):
        if SELECTED not in self.data:
            return []
        return self.data[self.data[SELECTED]][self.row_id_label].tolist()

    def apply_interaction(self, interaction):
        _type = interaction["type"]
        print("####################")
        print(_type)

        if CREATE == _type:
            self.data = self.data
        elif SELECTION == _type:
            param_name = interaction["name"]
            selection_type = interaction["select"]["type"]
            self.applied_sels_param_names.add(param_name)
            self.data = apply_selection(self.data, interaction)
            df = self.acc_and_empty_params(True)
            self.last_selection = get_last_selection(df, self.row_id_label)
        elif INVERT_SELECTION == _type:
            self.acc_and_empty_params()
            self.applied_sels_param_names.add(INVERT_SELECTED)
            self.data = apply_invert(self.data)
            df = self.acc_and_empty_params(True)
            self.last_selection = get_last_selection(df, self.row_id_label)
        elif INTENT == _type:
            self.acc_and_empty_params()
            self.applied_sels_param_names.add(INTENT_SELECTED)
            self.data = apply_intent_selection(self.data, interaction["intent"], self.row_id_label)
            df = self.acc_and_empty_params(True)
            self.last_selection = get_last_selection(df, self.row_id_label)
        elif FILTER == _type:
            self.acc_and_empty_params()
            self.data = apply_filter(self.data, interaction)
            self.last_selection = get_last_selection(self.data, self.row_id_label)
            self.data = mark_as_processed(self.data)
            self.data = drop_cols(self.data, [SELECTED])
        elif AGGREGATE == _type:
            self.acc_and_empty_params()
            self.data = apply_aggregate(self.data, interaction)
            self.data = mark_as_processed(self.data)
            self.data = drop_cols(self.data, [SELECTED, AGGREGATE_COLUMN])
        elif CATEGORIZE == _type:
            category_name = interaction["categoryName"]  
            selected_opt = interaction["selectedOption"]
            self.acc_and_empty_params()
            self.data = apply_category(self.data, category_name, selected_opt)
            p_name = PROCESSED + category_name
            self.data = mark_as_processed(self.data, p_name)
            self.processed_cols.append(p_name)
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

        self.get_point_statuses()
        # Post process
        print("Applied", self.applied_sels_param_names)
        print(self.processed_cols)

def accumulate_selections_and_drop_param_cols(df, applied_params):
    applied_params = list(applied_params)

    df[SELECTED] = df[applied_params].any(axis=1)


    df = df.drop(columns=applied_params)

    return df


def drop_cols(data, arr=None, prefix=None):
    if arr:
        arr = [x for x in arr if x in data]
        data = data.drop(columns=arr)
    if prefix:
        cols = [x  for x in data.columns if x.startswith(prefix)]
        data = data.drop(columns=cols)
    return data

def get_last_selection(data, row_id_label):
    data = data.copy(deep=True)
    if SELECTED not in data:
        return []
    if PROCESSED not in data:
        data[PROCESSED] = False
    return data[data[SELECTED] & ~data[PROCESSED]][row_id_label].tolist()
