import persist_ext.internals.plot as plot
from persist_ext.internals.utils import dev
from persist_ext.internals.widgets.persist_output.widget import PersistWidget
from persist_ext.internals.widgets.persist_output.wrappers import (
    Persist,
    PersistChart,
    PersistTable,
)

dev.DEV = False


def enable_dev_mode():
    dev.DEV = True
    print("Enabling dev mode for Persist.")


__all__ = [
    "plot",
    "enable_dev_mode",
    "PersistWidget",
    "Persist",
    "PersistChart",
    "PersistTable",
]
