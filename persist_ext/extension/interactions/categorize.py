from persist_ext.extension.interactions.selections import SELECTED
from persist_ext.extension.interactions.utils import PROCESSED


def apply_category(df, category_name, selected_opt):
    processed_col_name = PROCESSED + category_name

    if processed_col_name not in df:
        df[processed_col_name] = False

    if category_name not in df:
        df[category_name] = "None"

    df.loc[df[SELECTED] & ~df[processed_col_name], category_name] = selected_opt

    return df
