import pandas as pd

def is_dataframe_or_url(data):
    print()
    if not isinstance(data, pd.DataFrame) and not isinstance(data, str):
        return False
    return True
