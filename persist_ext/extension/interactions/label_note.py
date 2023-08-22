import datetime
from persist_ext.extension.interactions.selections import SELECTED
from persist_ext.extension.interactions.utils import PROCESSED


LABEL_COLUMN = "__label"
NOTE_COLUMN = "__note"
NOTED_COLUMN = "__noted_on"

def apply_label(df, label):
    if PROCESSED not in df:
        df[PROCESSED] = False

    if LABEL_COLUMN not in df:
        df[LABEL_COLUMN] = "-"

    df.loc[df[SELECTED] & ~df[PROCESSED], LABEL_COLUMN] = label
    
    return df

def apply_note(df, note_object):
    note = note_object["note"]
    dt = note_object["createdOn"]
    dt = datetime.datetime.fromtimestamp(dt / 1000)

    if PROCESSED not in df:
        df[PROCESSED] = False

    if NOTE_COLUMN not in df:
        df[NOTE_COLUMN] = "-"
        df[NOTED_COLUMN] = "-"

    df.loc[df[SELECTED] & ~df[PROCESSED], NOTE_COLUMN] = note
    df.loc[df[SELECTED] & ~df[PROCESSED], NOTED_COLUMN] = dt.strftime("%Y-%m-%d %H:%M:%S")
    
    return df

