from persist_ext.extension.interactions.selections import SELECTED
from persist_ext.extension.interactions.utils import PROCESSED


AGGREGATE_COLUMN = "__aggregate"

def apply_aggregate(df, agg):
    op = agg["op"]
    agg_name = agg["agg_name"]

    if PROCESSED not in df:
        df[PROCESSED] = False

    if AGGREGATE_COLUMN not in df:
        df[AGGREGATE_COLUMN] = "-"

    df.loc[df[SELECTED] & ~df[PROCESSED], AGGREGATE_COLUMN] = agg_name

    return df
