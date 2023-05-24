class DataFrameStorage:
    storage = dict()

    @staticmethod
    def add(key, df):
        DataFrameStorage.storage[key] = df

    @staticmethod
    def get(key):
        return DataFrameStorage.storage[key]

    @staticmethod
    def remove(key):
        if key in DataFrameStorage.storage:
            del DataFrameStorage.storage[key]

    @staticmethod
    def remove_multiple(keys):
        for key in keys:
            DataFrameStorage.remove(key)

