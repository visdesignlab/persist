from persist_ext.internals.widgets.base.base_output_object import OutputObject


class DataTableOutput(OutputObject):
    def __init__(self, widget):
        super(DataTableOutput, self).__init__(widget=widget)

    def _apply_create(self, interaction, data, chart):
        return super()._apply_create(interaction, data, chart)
