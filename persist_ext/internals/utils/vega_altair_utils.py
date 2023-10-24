def get_mark_type(chart):
    if isinstance(chart, dict):
        m = chart["mark"]
        if "type" in m:
            return m["type"]
    return getattr(chart, "mark", None)
