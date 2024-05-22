import persist_ext.internals.plot as plot
from persist_ext.internals.utils import dev
from persist_ext.internals.widgets.persist_output.widget import PersistWidget
from persist_ext.internals.widgets.persist_output.wrappers import (
    Persist,
    PersistChart,
    PersistTable,
)

dev.DEV = False

print("Persist extension loaded!")


def enable_dev_mode():
    dev.DEV = True
    print("Dev mode enabled!")


__all__ = [
    "plot",
    "dev",
    "enable_dev_mode",
    "PersistWidget",
    "Persist",
    "PersistChart",
    "PersistTable",
]
