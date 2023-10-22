from pandas import DataFrame


def get(name: str, groupby=None, aggregate={}) -> DataFrame:
    from persist_ext.internals.data.generated import global_generated_record

    return global_generated_record.get(name, groupby, aggregate)
