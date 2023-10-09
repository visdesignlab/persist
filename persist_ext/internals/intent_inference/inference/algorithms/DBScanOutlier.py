from typing import List

import pandas as pd

from ...compute.dbscan import dbscan
from .base import AlgorithmBase


class DBScanOutlier(AlgorithmBase):
    def __init__(
        self,
        data: pd.DataFrame,
        dimensions: List[str],
        eps,
        min_samples,
    ):
        self.algorithm = "DBScan"
        self.intent = "Outlier"
        self.dimensions = dimensions
        clf = dbscan(data[dimensions].dropna().values, eps, min_samples)
        self.labels = clf.labels_
        self.params = clf.get_params()
        self.info = {}

    @staticmethod
    def compute(data: pd.DataFrame, combinations, epss, min_samples):
        for combo in combinations:
            for eps in epss:
                for m in min_samples:
                    instance = DBScanOutlier(data, combo, eps, m)
                    yield instance
