from IPython.display import display, JSON, HTML
import pandas as pd


def send_to_nb(data):
    isStr = isinstance(data, str)
    if isStr:
        return data
    if isinstance(data, pd.DataFrame):
        return display(HTML(data.to_html()))
    print("Here")
    return display(JSON(data))


