from typing import List

import pandas as pd

from ...compute.kmeans_cluster import kmeans_cluster
from .base import AlgorithmBase


class KMeansCluster(AlgorithmBase):
    def __init__(
        self,
        data: pd.DataFrame,
        dimensions: List[str],
        n_cluster,
    ):
        self.algorithm = "KMeans"
        self.intent = "Cluster"
        self.dimensions = dimensions
        clf = kmeans_cluster(data[dimensions].dropna().values, n_cluster)
        self.labels = clf.labels_
        self.params = clf.get_params()
        self.info = {"centers": clf.cluster_centers_.tolist()}

    @staticmethod
    def compute(data: pd.DataFrame, combinations, n_clusters):
        for combo in combinations:
            for n_cluster in n_clusters:
                instance = KMeansCluster(data, combo, n_cluster)
                yield instance
