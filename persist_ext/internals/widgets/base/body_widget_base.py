import json
from abc import ABC, abstractmethod

import traitlets
from pandas import DataFrame

from persist_ext.internals.dataframe.idfy import ID_COLUMN, idfy_dataframe
from persist_ext.internals.widgets.base.widget_with_trrack import WidgetWithTrrack
from persist_ext.internals.widgets.vegalite_chart.selection import SELECTED_COLUMN


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

        if SELECTED_COLUMN not in data:
            data[SELECTED_COLUMN] = False

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
        copied_var_dict = self._copy_vars()

        # Loop over interaction and update the copies
        for interaction in interactions:
            _type = interaction["type"]
            fn_name = f"_apply_{_type}"
            if hasattr(self, fn_name):
                fn = getattr(self, fn_name)
                copied_var_dict = fn(interaction=interaction, **copied_var_dict)
            else:
                raise ValueError(f"Method {fn_name} not implemented")

        # Replace traitlets with copies by holding sync
        with self.hold_sync():
            self._update_copies(**copied_var_dict)

    @abstractmethod
    def _copy_vars(self):
        pass

    @abstractmethod
    def _update_copies(self, **kwargs):
        pass

    # interaction methods
    @abstractmethod
    def _apply_create(self, **kwargs):
        pass

    @abstractmethod
    def _apply_select(self, **kwargs):
        pass

    @abstractmethod
    def _apply_filter(self, **kwargs):
        pass

    def _rename_columns_common(self, column_name_map, data):
        data = data.rename(columns=column_name_map)

        return data

    @abstractmethod
    def _apply_rename_column(self, **kwargs):
        pass
