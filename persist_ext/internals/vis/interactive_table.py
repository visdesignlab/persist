from persist_ext.internals.dataframe.validate import is_dataframe_or_url
from persist_ext.internals.widgets.interactive_table.interactive_table_widget import (
    InteractiveTableWidget,
)
from persist_ext.internals.widgets.trrackable_output.trrackable_output_widget import (
    TrrackableOutputWidget,
)


def interactive_table(data):
    data = is_dataframe_or_url(data)

    return TrrackableOutputWidget(body_widget=InteractiveTableWidget(data=data))
