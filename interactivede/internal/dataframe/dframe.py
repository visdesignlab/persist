df_list = {}


class DFrame:
    dfList = dict()

    @staticmethod
    def add(key, df):
        df_list[key] = df

    @staticmethod
    def get(key):
        return df_list[key]
