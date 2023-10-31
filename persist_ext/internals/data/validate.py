import pandas as pd


def DEFAULT_PREPROCESS_FN(df):
    df = pd.read_json(df.to_json())
    return df


def is_dataframe_or_url(data, preprocess_fn=DEFAULT_PREPROCESS_FN, should_raise=True):
    if isinstance(data, str):
        if data.endswith(".csv"):
            data = pd.read_csv(data)
            data = preprocess_fn(data)
        elif data.endswith(".json"):
            data = pd.read_json(data)
            data = preprocess_fn(data)
        return data

    if isinstance(data, pd.DataFrame):
        return preprocess_fn(data)

    if should_raise:
        raise ValueError("arg should be a valid pandas dataframe or url to a csv file.")

    return False
