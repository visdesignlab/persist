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
        [ID_COLUMN, SELECTED_COLUMN_BRUSH, SELECTED_COLUMN_INTENT]
    ).tag(sync=True)
    # Non-meta columns of the data
    df_non_meta_columns = traitlets.List().tag(sync=True)
    # Numeric columns
    df_numeric_columns = traitlets.List().tag(sync=True)
    # Data types
    df_column_dtypes = traitlets.Dict().tag(sync=True)

    # Values of the data
    df_values = traitlets.List().tag(sync=True)

    # Is anything selected?
    df_has_selections = traitlets.Bool(default_value=False).tag(sync=True)

    renamed_column_record = {}

    # For tracking generated datasets
    generated_dataframe_record = traitlets.Dict(default_value=dict()).tag(
        sync=True,
    )

    def __init__(self, widget_key=None, *args, **kwargs):
        if widget_key is None:
            raise ValueError("widget_key cannot be none")

        esm, css = get_widget_esm_css(widget_key)
        self._esm = esm
        self._css = css

        if type(self) is WidgetWithTrrack:
            raise NotImplementedError("Cannot create instance of this base class")

        super(WidgetWithTrrack, self).__init__(*args, **kwargs)
