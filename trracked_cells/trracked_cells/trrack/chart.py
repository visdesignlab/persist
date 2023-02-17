from IPython.display import publish_display_data


class Chart:
    def __init__(self, ch):
        self.ch = ch

    def __repr__(self):
        return self.ch.__repr__()

    def _repr_mimebundle_(self, include=None, exclude=None):
        return "hello"
