import traitlets
import traitlets.traitlets

from persist_ext.internals.widgets.base.widget_with_trrack import WidgetWithTrrack


class TrrackWidget(WidgetWithTrrack):
    __widget_key = "trrack"

    interactions = traitlets.List().tag(sync=True)

    cell_id = traitlets.Unicode("").tag(sync=True)

    def __init__(self):
        super(TrrackWidget, self).__init__(widget_key=self.__widget_key)

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass
