from IPython.display import display, JSON


def send_to_nb(data):
    print("A B")

    isStr = isinstance(data, str)
    if isStr:
        return data
    return display(JSON(data))


