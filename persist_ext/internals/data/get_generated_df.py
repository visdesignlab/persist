from pandas import DataFrame


def get(name: str) -> DataFrame:
    from persist_ext.internals.data.generated import global_generated_record

    return global_generated_record.get(name)
