def apply_rename_column(df, prev_name, new_name):
    df = df.rename(columns={
            prev_name: new_name 
        })

    return df

