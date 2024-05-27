import datetime

PR_ANNOTATE = "PR_Annotation"
ANNOTATE_COLUMN_NAME = PR_ANNOTATE
NO_ANNOTATION = "No Annotation"


def create_annotation_string(text, created_on):
    return f"[{datetime.datetime.fromtimestamp(created_on / 1000).strftime('%d-%m-%y (%H:%M)')}] -->{text}"  # noqa E501
