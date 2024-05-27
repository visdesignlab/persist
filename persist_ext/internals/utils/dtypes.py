import pandas as pd

INT64_DTYPE = "Int64"
FLOAT64_DTYPE = "Float64"
BOOLEAN_DTYPE = "boolean"
CATEGORY_DTYPE = "category"
DATETIME_DTYPE = "datetime64[ns]"
TIMEDELTA_DTYPE = "timedelta64[ns]"
STRING_DTYPE = "string"
OBJECT_DTYPE = "object"


SUPPORTED_DTYPES = [
    INT64_DTYPE,  # Standardized integer type
    FLOAT64_DTYPE,  # Standardized floating-point type
    BOOLEAN_DTYPE,  # Standardized boolean type supporting NA values
    CATEGORY_DTYPE,  # Categorical type for nominal and ordinal data
    DATETIME_DTYPE,  # Standardized datetime type
    TIMEDELTA_DTYPE,  # Standardized timedelta type
    STRING_DTYPE,  # Standardized string type for handling textual data in native Python format
    OBJECT_DTYPE,  # Standard object type for miscellaneous data like strings
]

DTYPE_MAP = {
    # Integer types
    "int": INT64_DTYPE,
    "int8": INT64_DTYPE,
    "int16": INT64_DTYPE,
    "int32": INT64_DTYPE,
    "int64": INT64_DTYPE,
    "Int8": INT64_DTYPE,
    "Int16": INT64_DTYPE,
    "Int32": INT64_DTYPE,
    "Int64": INT64_DTYPE,
    # Floating types
    "float": FLOAT64_DTYPE,
    "float16": FLOAT64_DTYPE,
    "float32": FLOAT64_DTYPE,
    "float64": FLOAT64_DTYPE,
    "Float16": FLOAT64_DTYPE,
    "Float32": FLOAT64_DTYPE,
    "Float64": FLOAT64_DTYPE,
    # Boolean types
    "bool": BOOLEAN_DTYPE,
    "boolean": BOOLEAN_DTYPE,
    # Object type
    "object": OBJECT_DTYPE,
    "O": OBJECT_DTYPE,
    # Categorical type
    "category": CATEGORY_DTYPE,
    # Datetime types
    "datetime64[ns]": DATETIME_DTYPE,
    "datetime": DATETIME_DTYPE,
    # Timedelta types
    "timedelta64[ns]": TIMEDELTA_DTYPE,
    "timedelta": TIMEDELTA_DTYPE,
    # String types
    "str": STRING_DTYPE,
    "string": STRING_DTYPE,
}


def normalize_dtypes(df: pd.DataFrame):
    df = df.convert_dtypes()

    mp = {col: DTYPE_MAP[str(dtype)] for col, dtype in df.dtypes.items()}

    df = df.astype(mp)

    for col in df.columns:
        if str(df[col].dtype) == STRING_DTYPE:
            if df[col].apply(lambda x: x.startswith("P")).all():
                try:
                    df[col] = pd.to_timedelta(df[col])
                except TypeError:
                    pass

    return df
