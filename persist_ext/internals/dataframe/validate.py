import pandas as pd


def is_dataframe_or_url(data, should_raise=True):
    if isinstance(data, str) and data.endswith(".csv"):
        return pd.read_csv(data)
    if isinstance(data, pd.DataFrame):
        return data

    if should_raise:
        raise ValueError("arg should be a valid pandas dataframe or url to a csv file.")

    return False
