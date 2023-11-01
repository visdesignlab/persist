import traitlets
import traitlets.traitlets
from persist_ext.internals.data.generated import add_dataframe, has_dataframe
from persist_ext.internals.data.process_generate_dataset import process_generate_dataset

from persist_ext.internals.widgets.base.widget_with_trrack import WidgetWithTrrack


class DataframeFooter(WidgetWithTrrack):
    __widget_key = "dataframe_footer"

    cell_id = traitlets.Unicode("").tag(sync=True)

    def __init__(self, body_widget):
        super(DataframeFooter, self).__init__(widget_key=self.__widget_key)
        self._body_widget = body_widget

    @traitlets.observe("generate_dataframe_record")
    def _on_gdr_change(self, change):
        print("New", change.new)

    # Hack, use validate for signalling
    @traitlets.observe("generate_dataframe_signal")
    def _on_signal(self, change):
        value = change.new

        record = value["record"]
        post = value["post"]

        self._create(record, post)

    def _create(self, record, post=False, dynamic=False):
        # Set initial data as None
        data = None
        df_name = record["dfName"]

        if has_dataframe(df_name):
            return

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
        add_dataframe(df_name, process_generate_dataset(data), dynamic)

        gen_record = self.generated_dataframe_record.copy()
        gen_record[df_name] = record

        with self.hold_sync():
            self.generated_dataframe_record = gen_record

        self.send(
            {
                "msg": {
                    "type": "df_created",
                    "record": record,
                    "post": post if post else "none",
                }
            }
        )

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
