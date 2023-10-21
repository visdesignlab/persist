from pandas import DataFrame
import traitlets
from traitlets.traitlets import Unicode
from persist_ext.internals.data.generated import (
    add_dataframe,
    has_dataframe,
    remove_dataframe,
)

from persist_ext.internals.widgets.base.widget_with_trrack import WidgetWithTrrack


class HeaderWidget(WidgetWithTrrack):
    __widget_key = traitlets.Any(default_value="header").tag(sync=True)

    cell_id = Unicode("12").tag(sync=True)

    def __init__(self):
        super(HeaderWidget, self).__init__(widget_key=self.__widget_key)

    @traitlets.observe("interactions")
    def _on_interaction_change_df_gen(self, change):
        for df_name, df_record in self.generated_dataframe_record.items():
            if df_record["dynamic"] is True and not has_dataframe(df_name):
                self.create(df_record)

    @traitlets.observe("generated_dataframe_record")
    def _on_generated_dataframe_record(self, change):
        msg = []
        err = []

        old = change["old"]
        new = change["new"]

        added_df_names = set(new) - set(old)
        removed_df_names = set(old) - set(new)

        for removed in removed_df_names:
            remove_dataframe(removed)

        for df_name, df_record in new.items():
            try:
                if not has_dataframe(df_name):
                    df = self._create(df_record)
                    add_dataframe(df_name, df)

                if df_name in added_df_names:
                    msg.append({"type": "df-created", "name": df_name})
            except Exception as e:
                err.append(repr(e))

        self.send({"msg": msg, "error": err})

    def _create(self, record):
        is_dynamic = record["dynamic"]

        if is_dynamic:
            return self.data.copy(deep=True)

        data = self._persistent_data.copy(deep=True)

        interactions = record["interactions"]

        for interaction in interactions:
            print(interaction)

        return data

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
