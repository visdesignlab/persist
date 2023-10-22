from typing import Dict
from pandas import DataFrame
from IPython.display import display, HTML


class GeneratedRecord:
    __dataframe_map: Dict[str, DataFrame] = dict()

    ### Return a error widget here with button to regenerate
    def get(self, name: str, groupby=None, aggregate={}):
        if name not in self.__dataframe_map:
            return display(
                HTML(
                    f"""
                        <div style="padding:1em;background-color:rgba(250,176,5,0.3);border:1px solid rgb(250,176,5)">
                            <strong>Error!</strong> No dataframe named <strong>'{name}'</strong>. Run the cell where the dataframe was generated to create it!
                        </div>
                    """
                )
            )

        data = self.__dataframe_map[name]

        if groupby is not None and groupby in data:
            data = data.groupby(groupby)
            if len(aggregate) > 0:
                data = data.agg(aggregate)
            else:
                data = data.agg("mean")

        return data

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
