ID_COLUMN = "__id_column"


def idfy_dataframe(df, id_column):
    if id_column not in df:
        ids = df.index + 1
        df.insert(0, id_column, ids)
        df[id_column] = df[id_column].apply(str)
    else:
        if df[id_column].unique().size != df.shape[0]:
            raise Exception(f"Column '{id_column}' already exists, but not unique")

    return df
