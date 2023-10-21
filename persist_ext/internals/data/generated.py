from typing import Dict
from pandas import DataFrame


class GeneratedRecord:
    __dataframe_map: Dict[str, DataFrame] = dict()

    def get(self, name: str):
        if name not in self.__dataframe_map:
            raise Exception(
                f"No dataframe named '{name}'. Click the regenerate button in the Trrack graph to recreate it."
            )

        return self.__dataframe_map[name]

    def set(self, name: str, data: DataFrame, override):
        if not override and name in self.__dataframe_map:
            raise KeyError(f"Already exists dataframe named '{name}'")

        self.__dataframe_map[name] = data
        return True

    def has(self, name: str) -> bool:
        return name in self.__dataframe_map

    def remove(self, name: str):
        if self.has(name):
            del self.__dataframe_map[name]


global_generated_record = GeneratedRecord()


def keys():
    return global_generated_record.__dataframe_map.keys()


def remove_dataframe(name: str):
    global_generated_record.remove(name)


def has_dataframe(name: str):
    return global_generated_record.has(name)


def add_dataframe(name: str, data: DataFrame, override):
    return global_generated_record.set(name, data, override)
