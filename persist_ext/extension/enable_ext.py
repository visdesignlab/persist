from typing import List, Union


valid_values = ["altair"]

# enable ide for output of following modules
def enable(_for: Union[str, List[str]] = []):
    enable_for: List[str] = []

    if type(_for) is str:
        enable_for.append(_for)
    else:
        enable_for.extend(_for)

    for m in enable_for:
        if m not in valid_values:
            raise ValueError(
                "We do not support %s. Valid values are %s" % m, valid_values
            )

    version = None
    try:
        from persist_ext._version import __version__

        version = __version__
    finally:
        if version is None:
            version = "unknown"

    print("Loaded PersIst extension version %s" % version)
    for modulename in enable_for:
        if modulename == "altair":
            import altair as alt

            alt.renderers.enable("mimetype")  # type: ignore
            print("Extension enabled for %s" % modulename)

