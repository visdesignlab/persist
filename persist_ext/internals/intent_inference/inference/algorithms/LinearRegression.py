from typing import List

import pandas as pd

from ...compute.regression import regression
from .base import AlgorithmBase


class LinearRegression(AlgorithmBase):
    def __init__(
        self,
        data: pd.DataFrame,
        dimensions: List[str],
        threshold_multiplier,
    ):
        self.algorithm = "TheilSenRegressor"
        self.intent = "Linear Regression"
        self.dimensions = dimensions
        clf, inlier_mask, threshold, order = regression(
            data[dimensions].dropna().values, threshold_multiplier, order=1
        )
        self.labels = inlier_mask
        self.params = {
            "order": order,
            "multiplier": threshold_multiplier,
        }
        self.info = {
            "threshold": threshold,
            "order": order,
        }

    @staticmethod
    def compute(data: pd.DataFrame, combinations, threshold_multipliers):
        combinations = filter(lambda x: len(x) > 1, combinations)
        for combo in combinations:
            for tm in threshold_multipliers:
                instance = LinearRegression(data, combo, tm)
                yield instance
