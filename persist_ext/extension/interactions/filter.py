from persist_ext.extension.interactions.selections import SELECTED
from persist_ext.extension.interactions.utils import PROCESSED

FILTERED_OUT = "__filtered_out"

def apply_filter(df, filter):
    filter_out = filter['direction'] == 'out'

    if PROCESSED not in df:
        df[PROCESSED] = False

    if FILTERED_OUT not in df:
        df[FILTERED_OUT] = False

    if filter_out:
        df[FILTERED_OUT] =  df[SELECTED] & ~df[PROCESSED]
    else:
        df[FILTERED_OUT] =  ~df[SELECTED] & ~df[PROCESSED]

    return df
