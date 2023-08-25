import pandas as pd

def idfy_dataframe(df, row_id_column):
    if row_id_column not in df:
        df = df.reset_index(names=row_id_column)
        df[row_id_column] = df[row_id_column] + 1
    return df


DATE_TIME_PARTS = ["year" , "quarter" , "month" , "week" , "day" , "dayofyear" , "date" , "hours" , "minutes" , "seconds" , "milliseconds"]

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

def compare_pd_datetime_parts(date1, date2, parts = DATE_TIME_PARTS):
    print("---------------")
    print(type(date1), type(date2))
    date1 = pd.Timestamp(date1).replace(tzinfo=None)
    date2 = pd.Timestamp(date2).replace(tzinfo=None)
    print(date1, date2)

    for part in parts:
        if getattr(date1, part) != getattr(date2, part):
            print("Not Match", part, getattr(date1, part), getattr(date2, part))
            return False
        print("Match", getattr(date1, part))
    return True
