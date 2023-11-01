import anywidget
import traitlets

from persist_ext.internals.data.idfy import ID_COLUMN
from persist_ext.internals.utils.entry_paths import get_widget_esm_css

from persist_ext.internals.widgets.interactions.selection import (
    SELECTED_COLUMN_BRUSH,
    SELECTED_COLUMN_INTENT,
)


class WidgetWithTrrack(anywidget.AnyWidget):
    trrack = traitlets.Dict().tag(sync=True)  # Trrack graph

    interactions = traitlets.List().tag(sync=True)  # Interactions from current

    # list of all columns in the data
    df_columns = traitlets.List().tag(sync=True)
    # columns that represent meta information after applying interactions
    df_meta_columns = traitlets.List(
        [SELECTED_COLUMN_BRUSH, SELECTED_COLUMN_INTENT]
    ).tag(sync=True)
    # Non-meta columns of the data
    df_non_meta_columns = traitlets.List().tag(sync=True)
    # Numeric columns
    df_numeric_columns = traitlets.List().tag(sync=True)
    # Id Column
    df_id_column_name = traitlets.Unicode(default_value=ID_COLUMN).tag(sync=True)

    # For interactive table
    df_row_selection_status = traitlets.Dict(default_value={}).tag(sync=True)
    df_column_sort_status = traitlets.List(default_value=[]).tag(sync=True)

    # Values of the data
    df_values = traitlets.List().tag(sync=True)

    # Is anything selected?
    df_has_selections = traitlets.Bool(default_value=False).tag(sync=True)

    renamed_column_record = {}

    # For tracking generated datasets
    generated_dataframe_record = traitlets.Dict(default_value=dict()).tag(
        sync=True,
    )
    generate_dataframe_signal = traitlets.Dict({}).tag(sync=True)

    # Data types
    df_column_dtypes = traitlets.Dict().tag(sync=True)
    # Possible dtypes
    df_possible_dtypes = traitlets.Dict(
        {
            "string": ["string"],
            "Float64": ["datetime64[ns]", "Int64", "string", "Float64", "boolean"],
            "Int64": ["datetime64[ns]", "Int64", "string", "Float64", "boolean"],
            "datetime64[ns]": ["datetime64[ns]", "string"],
            "boolean": ["datetime64[ns]", "Int64", "string", "Float64", "boolean"],
        }
    ).tag(sync=True)

    # Sidebar
    intents = traitlets.List([]).tag(sync=True)
    loading_intents = traitlets.Bool(False).tag(sync=True)

    def __init__(self, widget_key=None, *args, **kwargs):
        if widget_key is None:
            raise ValueError("widget_key cannot be none")

        esm, css = get_widget_esm_css(widget_key)
        self._esm = esm
        self._css = css

        if type(self) is WidgetWithTrrack:
            raise NotImplementedError("Cannot create instance of this base class")

        super(WidgetWithTrrack, self).__init__(*args, **kwargs)
