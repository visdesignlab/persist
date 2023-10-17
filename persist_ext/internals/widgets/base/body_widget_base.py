import json
from abc import ABC, abstractmethod

import traitlets
from pandas import DataFrame

from persist_ext.internals.dataframe.idfy import ID_COLUMN, idfy_dataframe
from persist_ext.internals.widgets.base.widget_with_trrack import WidgetWithTrrack
from persist_ext.internals.widgets.vegalite_chart.annotation import (
    ANNOTATE_COLUMN_NAME,
    NO_ANNOTATION,
    create_annotation_string,
)
from persist_ext.internals.widgets.vegalite_chart.selection import (
    SELECTED_COLUMN_BRUSH,
    SELECTED_COLUMN_INTENT,
    selected,
)


class _AbstractWidgetWithTrrack(type(WidgetWithTrrack), type(ABC)):
    pass


class BodyWidgetBase(WidgetWithTrrack, ABC, metaclass=_AbstractWidgetWithTrrack):
    # Base dataframe never changes
    _persistent_data = traitlets.Instance(DataFrame)

    # Backing dataframe for the view
    data = traitlets.Instance(DataFrame)

    def __init__(self, data, **kwargs):
        if type(self) is BodyWidgetBase:
            raise NotImplementedError("Cannot create instance of this base class")

        data = data.copy(deep=True)

        if ID_COLUMN not in data:
            data = idfy_dataframe(data)

        if SELECTED_COLUMN_BRUSH not in data:
            data[SELECTED_COLUMN_BRUSH] = False

        if SELECTED_COLUMN_INTENT not in data:
            data[SELECTED_COLUMN_INTENT] = False

        if ANNOTATE_COLUMN_NAME not in data:
            data[ANNOTATE_COLUMN_NAME] = NO_ANNOTATION

        super(BodyWidgetBase, self).__init__(
            data=data, _persistent_data=data.copy(deep=True), **kwargs
        )

    @traitlets.observe("data")
    def _handle_data_update(self, change):
        new_data = change.new

        with self.hold_sync():
            columns = list(new_data.columns)
            self.df_columns = columns
            self.df_non_meta_columns = list(
                filter(lambda x: x not in self.df_meta_columns, columns)
            )
            self.df_values = json.loads(new_data.to_json(orient="records"))

    @traitlets.observe("interactions")
    def _on_interaction_change(self, change):
        interactions = change.new
        self._interaction_change(interactions)

    def _interaction_change(self, interactions):
        copied_var_tuple = self._copy_vars()

        # Loop over interaction and update the copies
        for interaction in interactions:
            _type = interaction["type"]
            fn_name = f"_apply_{_type}"
            if hasattr(self, fn_name):
                fn = getattr(self, fn_name)
                copied_var_tuple = fn(interaction, *copied_var_tuple)
            else:
                raise ValueError(f"Method {fn_name} not implemented")

        # Replace traitlets with copies by holding sync
        with self.hold_sync():
            self._update_copies(*copied_var_tuple)

    @abstractmethod
    def _copy_vars(self):
        pass

    @abstractmethod
    def _update_copies(self, *args):
        pass

    ##### interaction methods
    # create
    @abstractmethod
    def _apply_create(self, **kwargs):
        pass

    # selection
    @abstractmethod
    def _apply_select(self, **kwargs):
        pass

    @abstractmethod
    def _clear_selections(self, data):
        pass

    def _clear_selection_data(self, data):
        data[SELECTED_COLUMN_BRUSH] = False
        data[SELECTED_COLUMN_INTENT] = False

        return data

    # filter
    @abstractmethod
    def _apply_filter(self, **kwargs):
        pass

    def _filter_common(self, data, direction):
        if direction == "in":
            data = data[selected(data)]
        else:
            data = data[~selected(data)]

        data = data.reset_index(drop=True)

        return data

    # categorize
    @abstractmethod
    def _apply_categorize(self, **kwargs):
        pass

    def _categorize_common(self, data, categorize_interaction):
        category = categorize_interaction["category"]
        option = categorize_interaction["option"]

        print(data, category)

        if category not in data:
            data[category] = "None"

        data.loc[selected(data), category] = option

        return data

    # annotate
    @abstractmethod
    def _apply_annotate(self, **kwargs):
        pass

    def _annotate_common(self, data, annotate_interaction):
        text = annotate_interaction["text"]
        created_on = annotate_interaction["createdOn"]
        annotation_str = create_annotation_string(text, created_on)

        print(annotation_str)

        def _append_annotation(val):
            if val == NO_ANNOTATION:
                return annotation_str
            return f"{val} | {annotation_str}"

        data.loc[selected(data), ANNOTATE_COLUMN_NAME] = data.loc[
            selected(data), ANNOTATE_COLUMN_NAME
        ].apply(_append_annotation)

        print(data[ANNOTATE_COLUMN_NAME].unique())

        return data

    # rename
    @abstractmethod
    def _apply_rename_column(self, **kwargs):
        pass

    def _rename_columns_common(self, data, rename_interaction):
        previous_column_name = rename_interaction["previousColumnName"]
        new_column_name = rename_interaction["newColumnName"]

        new_col_name_map = {previous_column_name: new_column_name}

        data = data.rename(columns=new_col_name_map)

        return data

    # drop
    @abstractmethod
    def _apply_drop_columns(self, **kwargs):
        pass

    def _drop_columns_common(self, data, columns):
        if len(columns) > 0:
            data = data.drop(columns, axis=1)

        return data
