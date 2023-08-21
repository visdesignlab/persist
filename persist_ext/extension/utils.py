def idfy_dataframe(df, row_id_column):
    if row_id_column not in df:
        df = df.reset_index(names=row_id_column)
    df[row_id_column] = df[row_id_column] + 1
    return df
