from typing import List, Union
from .apply import create_dataframe
from .enable_ext import enable as en
from .intents import predict as predict_intents

def enable(enable_for: Union[str, List[str]] = []):
    return en(enable_for)

def apply(data, interactions, base_cols = []):
    return create_dataframe(data, interactions, base_cols)

def predict(data, interactions, features = []):
    return predict_intents(data, interactions, features)

__all__ = ["enable", "apply", "predict"]
