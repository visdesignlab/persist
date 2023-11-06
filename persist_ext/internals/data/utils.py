def is_int(value):
    if isinstance(value, int):
        return True

    try:
        int(value)
        return True
    except ValueError:
        return False


def is_float(value):
    if isinstance(value, float):
        return True

    try:
        float(value)
        return True
    except ValueError:
        return False


def is_numeric(value):
    return is_int(value) or is_float(value)


def is_str(value):
    return isinstance(value, str)


def set_df_attr(df, key, value):
    df.attrs[key] = value


def get_df_attr(df, key):
    return df.attrs[key]
