DATE_TIME_PARTS = [
    "year",
    "quarter",
    "month",
    "week",
    "day",
    "dayofyear",
    "date",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
]

REPLACE_DATE_TIME_PARTS = DATE_TIME_PARTS + ["ofyear", "milli"]


def has_timeunit_parts(col_name):
    timeunit_str = extract_timeunit_parts(col_name)
    if timeunit_str == col_name:
        return False

    for p in REPLACE_DATE_TIME_PARTS:
        if len(timeunit_str) == 0:
            return True
        timeunit_str = timeunit_str.replace(p, "")
    return len(timeunit_str) == 0


def extract_timeunit_parts(col_name):
    if "_" not in col_name:
        return col_name

    return col_name.split("_")[0]


def strip_timeunit_parts(col_name):
    return "_".join(col_name.split("_")[1:])


def get_time_unit_parts(timeunit):
    parts = list(filter(lambda x: x in timeunit, DATE_TIME_PARTS))

    if "day" in parts:
        replaced = timeunit.replace("dayofyear", "-----")
        if "day" not in replaced:
            parts = list(filter(lambda x: x != "day", parts))

    if "seconds" in parts:
        replaced = timeunit.replace("milliseconds", "-----")
        if "seconds" not in replaced:
            parts = list(filter(lambda x: x != "seconds", parts))

    return parts


def create_equal_query_for_timeunit(column_name, unix_ts, timeunits):
    if not isinstance(timeunits, list):
        timeunits = [timeunits]

    q = ""

    for unit in timeunits:
        if len(q) > 0:
            q += " & "

        q += f"@pd.to_datetime(`{column_name}`).dt.{unit} == @pd.to_datetime({unix_ts}, unit='ms').{unit}"
    return f"({q})"


def create_range_query_for_timeunit(column_name, unix_ts, timeunits):
    if not isinstance(timeunits, list):
        timeunits = [timeunits]

    q = ""

    for unit in timeunits:
        if len(q) > 0:
            q += " & "
        lower = min(unix_ts)
        upper = max(unix_ts)
        q += f"@pd.to_datetime({lower}, unit='ms').{unit} <= @pd.to_datetime(`{column_name}`).dt.{unit}  <= @pd.to_datetime({upper}, unit='ms').{unit}"
    return f"({q})"
