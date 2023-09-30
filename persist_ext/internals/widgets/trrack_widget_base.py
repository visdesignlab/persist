import anywidget
import traitlets


class WidgetWithTrrack(anywidget.AnyWidget):
    trrack = traitlets.Dict().tag(sync=True)
    interactions = traitlets.List().tag(sync=True)

    def __init__(self, *args, **kwargs):
        if type(self) is WidgetWithTrrack:
            raise NotImplementedError("Cannot create instance of this base class")
        super().__init__(*args, **kwargs)
