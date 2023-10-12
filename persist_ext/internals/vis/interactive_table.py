from persist_ext.internals.dataframe.validate import is_dataframe_or_url
from persist_ext.internals.widgets.interactive_table.interactive_table_widget import (
    InteractiveTableWidget,
)
from persist_ext.internals.widgets.trrackable_output.output_with_trrack_widget import (
    OutputWithTrrackWidget,
)


def interactive_table(data):
    data = is_dataframe_or_url(data)

    return OutputWithTrrackWidget(body_widget=InteractiveTableWidget(data=data))
