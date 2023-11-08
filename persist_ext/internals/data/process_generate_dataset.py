from persist_ext.internals.data.idfy import ID_COLUMN
from persist_ext.internals.widgets.interactions.selection import (
    SELECTED_COLUMN_BRUSH,
    SELECTED_COLUMN_INTENT,
)


def process_generate_dataset(df, keep_selection_columns=False, keep_id_col=False):
    df = df.copy(deep=True)

    cols_to_remove = []

    if not keep_id_col:
        cols_to_remove.append(ID_COLUMN)

    def process_selection_column(data):
        is_selected = data[SELECTED_COLUMN_BRUSH]
        data = data.drop(columns=[SELECTED_COLUMN_BRUSH])

        if is_selected.sum() > 0:
            data["is_selected"] = is_selected

        return data

    df = process_selection_column(df)

    if not keep_selection_columns:
        cols_to_remove.append(SELECTED_COLUMN_INTENT)

    df.drop(columns=cols_to_remove, inplace=True)

    return df
