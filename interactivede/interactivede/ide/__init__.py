import sys
from typing import List

valid_values = ["altair"]


def enable(enable_for: str | List[str] = []):
    if type(enable_for) is str:
        enable_for = [enable_for]

    for m in enable_for:
        if m not in valid_values:
            raise ValueError(
                "We do not support %s. Valid values are %s" % m, valid_values
            )

    for modulename in enable_for:
        if modulename == "altair":
            import altair as alt

            alt.renderers.enable("mimetype")  # type: ignore
            print("Extension enabled for %s" % modulename)
