from itertools import product
from typing import List

import pandas as pd
from ...compute.pareto import pareto

from .base import AlgorithmBase


class MultivariateOptimization(AlgorithmBase):
    def __init__(self, data: pd.DataFrame, dimensions: List[str], sense: List[str]):
        self.algorithm = "BNL"
        self.intent = "Multivariate Optimization"
        self.dimensions = dimensions
        mask = pareto(data[dimensions].dropna().values, sense)
        self.labels = mask
        self.params = {"sense": sense}
        self.info = {}

    @staticmethod
    def compute(data: pd.DataFrame, combinations):
        for combo in combinations:
            for sense in get_sense_combinations(combo):
                instance = MultivariateOptimization(data, combo, sense)
                yield instance


def get_sense_combinations(columns):
    res = [list(r) for r in product(["min", "max"], repeat=len(columns))]
    return res
