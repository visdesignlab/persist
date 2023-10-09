from .consts import *


def jaccard_similarity(predicted, selected, auto_complete=False):
    predicted = set(predicted)
    selected = set(selected)

    inter = predicted.intersection(selected)
    union = predicted.union(selected)

    if len(union) == 0:
        return 0

    if not auto_complete:
        return len(inter) / len(union)

    predicted_not_selected = predicted - selected
    selected_not_predicted = selected - predicted

    return len(inter) / (
        len(inter)
        + 0.4 * len(selected_not_predicted)
        + 0.1 * len(predicted_not_selected)
        + 3
    )
