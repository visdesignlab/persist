import json
from typing import Dict, List

import numpy as np
import pandas as pd
from ..compute.dbscan import dbscan
from ..compute.isolationforest_outlier import isolationforest_outlier
from ..compute.kmeans_cluster import kmeans_cluster
from ..compute.pareto import pareto
from ..compute.regression import regression

from .algorithms.base import AlgorithmBase


class Intent:
    def __init__(
        self,
        intent: str,
        algorithm: str,
        dimensions: str,
        params: Dict[str, any],
        info: Dict[str, any] = None,
        output: str = "",
        **kwargs
    ):
        self.intent = intent
        self.algorithm = algorithm
        self.output = list(map(int, output.split(","))) if len(output) > 0 else []
        self.dimensions = (
            dimensions.split(",") if isinstance(dimensions, str) else dimensions
        )
        self.params = json.loads(params) if isinstance(params, str) else params
        self.info = json.loads(info) if isinstance(info, str) else info

    @staticmethod
    def from_algorithm(alg: AlgorithmBase):
        return Intent(**alg.to_dict())

    @staticmethod
    def from_intent(intent):
        i = Intent(**intent)
        return i

    def apply(self, data: pd.DataFrame, row_id: str):
        ids: List[str] = []

        data.dropna()  # removes all missing values

        subset = data[self.dimensions]

        if self.intent == "Cluster":
            if self.algorithm == "KMeans":
                print(self.info)
                clf = kmeans_cluster(
                    subset.values,
                    self.params["n_clusters"],
                    np.array(self.info["centers"]),
                )
                closest_center = self.info["selected_center"]
                centers = clf.cluster_centers_
                distances = np.linalg.norm(centers - closest_center, axis=1)
                center_id = np.argmin(distances)
                ids = data[clf.labels_ == center_id][row_id].tolist()
            elif self.algorithm == "DBScan":
                clf = dbscan(
                    subset.values, self.params["eps"], self.params["min_samples"]
                )
                subset["labels"] = clf.labels_
                print(np.unique(clf.labels_))
                subset[row_id] = data[row_id]
                org_pts = set(self.info["members"])
                groups = subset.groupby("labels")
                distances = {}
                for name, group in groups:
                    grp = set(group[row_id].tolist())
                    distance = float(len(list(org_pts.intersection(grp)))) / float(
                        len(list(org_pts.union(grp)))
                    )
                    distances[name] = 1 - distance

                matched_group = min(distances, key=distances.get)
                ids = subset[subset.labels == matched_group][row_id].tolist()
        elif self.intent == "Outlier":
            if self.algorithm == "DBScan":
                clf = dbscan(
                    subset.values, self.params["eps"], self.params["min_samples"]
                )
                ids = data[clf.labels_ == -1][row_id].tolist()
            elif self.algorithm == "Isolation Forest":
                _, labels = isolationforest_outlier(
                    subset.values, self.params["contamination"]
                )
                subset[row_id] = data[row_id]
                subset["labels"] = labels
                ids = subset[subset.labels == -1][row_id].tolist()
        elif self.intent == "Multivariate Optimization":
            mask = pareto(subset.values, self.params["sense"])
            mask = list(map(lambda x: x == 1, mask))
            ids = data[mask][row_id].tolist()
        elif "Regression" in self.intent:
            output = regression(
                subset.values, 100, self.params["order"], self.params["multiplier"]
            )

            in_mask = output[1]
            mask = in_mask == 1

            is_inside = self.info["type"] != "Outside"
            if not is_inside:
                mask = np.logical_not(in_mask)

            ids = data[mask][row_id].tolist()

        return ids
