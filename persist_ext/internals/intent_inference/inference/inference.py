from typing import List

import pandas as pd

from ..compute.dbscan import dbscan_params
from ..compute.isolationforest_outlier import isolationforest_params
from ..compute.kmeans_cluster import kmeans_params
from ..compute.regression import regression_params
from .algorithms.DBScanCluster import DBScanCluster
from .algorithms.DBScanOutlier import DBScanOutlier
from .algorithms.IsolationForestOutlier import IsolationForestOutlier
from .algorithms.KMeansCluster import KMeansCluster
from .algorithms.LinearRegression import LinearRegression
from .algorithms.PolynomialRegression import PolynomialRegression
from .algorithms.Skyline import MultivariateOptimization
from .intent import Intent
from .prediction import Prediction


class Inference:
    def __init__(
        self,
        data: pd.DataFrame,
        user_selection: List[str],
        dimensions=List[str],
        intents: List[Intent] = [],
    ):
        self.data = data
        self.user_selections = user_selection
        self.dimensions = dimensions
        self.intents = []
        if intents and len(intents) > 0:
            self.intents = intents
        else:
            self.intents = compute_intents(data, dimensions)

    def predict(self) -> List[Prediction]:
        predictions: List[Prediction] = []

        for intent in self.intents:
            preds = Prediction.from_intent(intent, self.data, self.user_selections)
            predictions.extend(preds)

        sorted_predictions = sort_and_keep_unique(predictions)

        high_ranking_preds = list(
            filter(lambda x: x["rank_jaccard"] > 0.5, sorted_predictions)
        )

        if len(high_ranking_preds) >= 20:
            predictions = high_ranking_preds
        else:
            predictions = sorted_predictions[:20]

        return predictions


def sort_and_keep_unique(predictions: List[Prediction]):
    preds = list(map(lambda x: x.to_dict(), predictions))

    preds = pd.DataFrame(preds)

    preds.rank_jaccard = preds.rank_jaccard.round(5)

    grouped_preds = preds.groupby(["intent", "algorithm", "rank_jaccard"])

    preds = grouped_preds.apply(lambda group: group.iloc[0, :]).reset_index(drop=True)

    preds = preds.sort_values(by="rank_jaccard", ascending=False).reset_index(drop=True)

    return list(preds.T.to_dict().values())


def compute_intents(
    data: pd.DataFrame, _dimensions: List[str], skip=False
) -> List[Intent]:
    epss, min_samples = dbscan_params(data.shape[0])
    print(epss, min_samples)
    intents: List[Intent] = []
    dimensions = [_dimensions]

    # Outliers
    dbscan_outliers = DBScanOutlier.compute(data, dimensions, epss, min_samples)
    intents.extend(map(lambda x: Intent(**x.to_dict()), dbscan_outliers))

    if_outliers = IsolationForestOutlier.compute(
        data, dimensions, isolationforest_params()
    )
    intents.extend(map(lambda x: Intent(**x.to_dict()), if_outliers))

    # Clusters
    kmeans_clusters = KMeansCluster.compute(data, dimensions, kmeans_params())
    intents.extend(map(lambda x: Intent(**x.to_dict()), kmeans_clusters))

    dbscan_clusters = DBScanCluster.compute(data, dimensions, epss, min_samples)
    intents.extend(map(lambda x: Intent(**x.to_dict()), dbscan_clusters))

    # Skyline
    skyline = MultivariateOptimization.compute(data, dimensions)
    intents.extend(map(lambda x: Intent(**x.to_dict()), skyline))

    if not skip:
        # Regressions
        linear_regression = LinearRegression.compute(
            data, dimensions, regression_params()
        )
        intents.extend(map(lambda x: Intent(**x.to_dict()), linear_regression))

        polynomial_regression = PolynomialRegression.compute(
            data, dimensions, regression_params()
        )
        intents.extend(map(lambda x: Intent(**x.to_dict()), polynomial_regression))

    return intents
