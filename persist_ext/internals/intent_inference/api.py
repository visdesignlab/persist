import time
import warnings
from typing import Any, List

import pandas as pd

from .inference.inference import compute_intents, sort_and_keep_unique
from .inference.intent import Intent
from .inference.prediction import Prediction

warnings.filterwarnings("ignore")

# API: user provides dataframe, dimensions, user_selections
# API: returns list of predictions as JSON (map to_dict() over list)

# API: part 2: apply previous prediction to updated dataframe
#              selection is previous in prediction not selected and matches
# API: part 2: apply_prediction(prediction, dataframe)
# API: part 2: returns new list of predictions


def compute_predictions(
    df: pd.DataFrame,
    selections: List[Any],
    dimensions: List[str] = [],
    n_top_predictions=10,
    row_id_label="index",
):
    """
    Args:
        df: Dataframe on which predictions are to be made
        dimensions: List of dimensions to predict over
        selections: List of selections

    Returns: List of predictions

    Compute predictions for a given dataframe, dimensions, and selections.
    Returns a list of predictions.
    """
    predictions = []
    intents = compute_intents(df, dimensions)

    for intent in intents:
        predictions.extend(Prediction.from_intent(intent, df, selections, row_id_label))

    high_ranking_preds = list(filter(lambda x: x.rank_jaccard > 0.3, predictions))

    if len(high_ranking_preds) == 0:
        predictions = sort_and_keep_unique(predictions)
        predictions = predictions[:n_top_predictions]
    else:
        predictions = sort_and_keep_unique(high_ranking_preds)

        if len(predictions) > n_top_predictions:  # potentially parameterize this value
            predictions = predictions[:n_top_predictions]

    return predictions


def run_predictions(df: pd.DataFrame, dimensions: List[str], selections: List[any]):
    """
    Compute predictions for a given dataframe, dimensions, and selections.
    Returns a list of predictions as well as the time taken to generate them.
    """
    start_time = time.time()

    preds = compute_predictions(df, dimensions, selections)

    end_time = time.time() - start_time

    ret = {"predictions": preds, "time": end_time}

    return ret


def apply_prediction(
    df: pd.DataFrame, prediction: Prediction, row_id_label="__row_id__"
):
    """
    Apply a given prediction to a dataframe.
    Returns a new list of predictions.
    """
    # Using intent.apply
    intent = Intent(
        prediction["intent"],
        prediction["algorithm"],
        prediction["dimensions"],
        prediction["params"],
        prediction["info"],
    )

    new_ids = intent.apply(df, row_id_label)

    # update to return a better data structure
    return {
        "ids": new_ids,
        "prediction": Prediction.from_intent(intent, df, new_ids, row_id_label),
    }


def apply_and_generate_predictions(df: pd.DataFrame, prediction: Prediction):
    """
    Apply a given prediction to a dataframe.
    Returns a new list of predictions.
    """
    sel = apply_prediction(df, prediction)

    return compute_predictions(df, prediction["dimensions"], sel)
