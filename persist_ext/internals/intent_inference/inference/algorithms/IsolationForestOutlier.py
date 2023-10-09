from typing import List

import pandas as pd

from ...compute.isolationforest_outlier import isolationforest_outlier
from .base import AlgorithmBase


class IsolationForestOutlier(AlgorithmBase):
    def __init__(
        self,
        data: pd.DataFrame,
        dimensions: List[str],
        contamination,
    ):
        self.algorithm = "Isolation Forest"
        self.intent = "Outlier"
        self.dimensions = dimensions
        clf, labels = isolationforest_outlier(
            data[dimensions].dropna().values, contamination
        )
        self.labels = labels
        self.params = clf.get_params()
        self.info = {}

    @staticmethod
    def compute(data: pd.DataFrame, combinations, contaminations):
        for combo in combinations:
            for contamination in contaminations:
                instance = IsolationForestOutlier(data, combo, contamination)
                yield instance
