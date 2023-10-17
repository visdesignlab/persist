def get_mark_type(chart):
    return getattr(chart, "mark", None)
