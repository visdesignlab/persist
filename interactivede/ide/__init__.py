from interactivede.internal import *

valid_values = ["altair"]


def enable(enable_for=[]):
    if type(enable_for) is str:
        enable_for = [enable_for]

    for m in enable_for:
        if m not in valid_values:
            raise ValueError(
                "We do not support %s. Valid values are %s" % m, valid_values
            )

    version = None
    try:
        from interactivede._version import __version__

        version = __version__
    finally:
        if version is None:
            version = "unknown"

    print("Loaded InteractiveDE extension version %s" % version)
    for modulename in enable_for:
        if modulename == "altair":
            import altair as alt

            alt.renderers.enable("mimetype")  # type: ignore
            print("Extension enabled for %s" % modulename)

