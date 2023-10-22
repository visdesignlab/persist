import traitlets
from traitlets.traitlets import Unicode
from persist_ext.internals.data.generated import (
    add_dataframe,
    has_dataframe,
    remove_dataframe,
)
from persist_ext.internals.data.process_generate_dataset import process_generate_dataset

from persist_ext.internals.widgets.base.widget_with_trrack import WidgetWithTrrack


class HeaderWidget(WidgetWithTrrack):
    __widget_key = traitlets.Any(default_value="header").tag(sync=True)

    cell_id = Unicode("12").tag(sync=True)

    df_being_generated = traitlets.Unicode(default_value=None, allow_none=True).tag(
        sync=True
    )

    def __init__(self, body_widget):
        super(HeaderWidget, self).__init__(widget_key=self.__widget_key)
        self._body_widget = body_widget

    @traitlets.observe("interactions")
    def _on_interaction_change_df_gen(self, change):
        # Update dynamic dataframes when current changes
        for df_record in self.generated_dataframe_record.values():
            # Filter in dynamic dataframes
            if df_record["dynamic"] is True:
                # create
                try:
                    self._create(df_record)
                except Exception as ex:
                    raise ex

    @traitlets.observe("generated_dataframe_record")
    def _on_generated_dataframe_record(self, change):
        msg = []
        err = []

        old = change["old"]
        new = change["new"]

        # dataframes to add
        added_df_names = set(new) - set(old)
        # dataframes to remove
        removed_df_names = set(old) - set(new)

        # remove dfs
        for removed in removed_df_names:
            remove_dataframe(removed)

        # Try to generate dataframe
        for df_name, df_record in new.items():
            with self.hold_sync():
                self.df_being_generated = df_name
            try:
                self._create(df_record)

                # Notify creation success
                if df_name in added_df_names:
                    msg.append({"type": "df-created", "name": df_name})
            except Exception as e:
                err.append(repr(e))
            finally:
                self.df_being_generated = None

        self.send({"msg": msg, "error": err})

    def _create(self, record):
        # check if dynamic df
        is_dynamic = record["dynamic"]

        # Set initial data as none
        data = None

        if is_dynamic:
            # if dynamic then associate current data
            data = self._body_widget.data

        else:
            if has_dataframe(record["df_name"]):
                return
            # Generate data for list of interactions present in the record

            interactions = record["interactions"]

            # get last interactions
            last_interaction_id = interactions[-1]["id"]

            # if last interaction has no dataframe cached, generate and cache it.
            if last_interaction_id not in self._body_widget._cached_apply_record:
                self._body_widget._apply_interactions(
                    interactions, self.data.copy(deep=True)
                )

            # assign data from cache
            data = self._body_widget._get_data(
                *self._body_widget._from_cache(
                    *self._body_widget._cached_apply_record[last_interaction_id]
                )
            )

        # Assign data to df_name
        add_dataframe(
            record["df_name"], process_generate_dataset(data), override=is_dynamic
        )

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
