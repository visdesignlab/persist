from persist_ext.extension.interactions.selections import apply_selection, SELECTED

PROCESSED = "__processed"

def mark_as_processed(df, processed_col_name = PROCESSED):
    if processed_col_name not in df:
        df[processed_col_name] = False

    df.loc[df[SELECTED], processed_col_name] = True

    return df
