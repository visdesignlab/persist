import datetime

ANNOTATE_COLUMN_NAME = "__annotations"
NO_ANNOTATION = "No Annotation"


def create_annotation_string(text, created_on):
    return f"{datetime.datetime.fromtimestamp(created_on / 1000).strftime('%d-%m-%y (%H:%M)')} - {text}"  # noqa E501
