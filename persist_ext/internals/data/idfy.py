ID_COLUMN = "__id_column"


def idfy_dataframe(df, id_column=ID_COLUMN):
    if id_column not in df:
        df[id_column] = df.index + 1
    else:
        if df[id_column].unique().size != df.shape[0]:
            raise Exception(f"Column '{id_column}' already exists, but not unique")

    return df
