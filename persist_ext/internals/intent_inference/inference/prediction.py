import hashlib
import json
from copy import deepcopy
from typing import List

import numpy as np
import pandas as pd
from scipy.spatial import ConvexHull

from ..utils import jaccard_similarity
from .intent import Intent


def get_hull(data):
    try:
        vals = data.values
        hull = ConvexHull(vals)
        if data.shape[0] >= 3:
            vals = data.values
            hull = ConvexHull(vals)
            hull = vals[hull.vertices, :].tolist()
            return hull
    except:
        pass

    return []


# TODO: consider changing names of this and Intent
class Prediction:
    def __init__(self, intent: Intent):
        self.intent = intent.intent
        self.algorithm = intent.algorithm
        self.info = (
            json.loads(intent.info) if isinstance(intent.info, str) else intent.info
        )
        self.dimensions = intent.dimensions
        self.params = (
            json.loads(intent.params)
            if isinstance(intent.params, str)
            else intent.params
        )
        self.hash = None
        self.rank_jaccard = -1
        self.rank_auto_complete = -1  # not used, consider bringing back
        self.rank_nb = -1  # not used, consider bringing back
        self.members = []
        self.membership_stats = []

    def to_dict(self):
        return {
            "intent": self.intent,
            "algorithm": self.algorithm,
            "info": self.info,
            "params": self.params,
            "rank_jaccard": self.rank_jaccard,
            "rank_auto_complete": self.rank_auto_complete,
            "rank_nb": self.rank_nb,
            "dimensions": self.dimensions,
            "members": self.members,
            "membership_stats": self.membership_stats,
        }

    # TODO: not necessarily needed
    @staticmethod
    def from_intent(
        intent: Intent, data: pd.DataFrame, selections: List[str], row_id: str
    ) -> List["Prediction"]:
        data = data.dropna()  # NOTE: Dropping na here. should always drop na?
        cols = deepcopy(intent.dimensions)
        cols.append(row_id)
        if intent.algorithm == "DBScan":
            if intent.intent == "Outlier":
                mask = np.array(intent.output) == -1

                selected = []
                try:
                    selected = data[cols].dropna()[mask][row_id].tolist()
                except:
                    pass

                preds: List[Prediction] = []
                cluster_vals = np.unique(intent.output)
                for cluster_id in cluster_vals:
                    if cluster_id == -1:
                        continue
                    mask = np.array(intent.output) == cluster_id
                    selected = data[cols].dropna()[mask][row_id].tolist()
                    pred = Prediction(intent)
                    pred.members = selected
                    pred.rank_jaccard = jaccard_similarity(pred.members, selections)
                    pred.rank_auto_complete = jaccard_similarity(
                        pred.members, selections, True
                    )
                    pred.membership_stats = get_stats(pred.members, selections)
                    pred.info["members"] = selected
                    pred.info["hull"] = get_hull(data.loc[mask, intent.dimensions])
                    preds.append(pred)
                return preds
        elif intent.algorithm == "Isolation Forest":
            mask = np.array(intent.output) == -1

            selected = []
            try:
                selected = data[cols].dropna()[mask][row_id].tolist()
            except:
                pass

            pred = Prediction(intent)
            pred.members = selected
            pred.rank_jaccard = jaccard_similarity(pred.members, selections)
            pred.rank_auto_complete = jaccard_similarity(pred.members, selections, True)
            pred.membership_stats = get_stats(pred.members, selections)
            return [pred]
        elif intent.algorithm == "KMeans":
            preds: List[Prediction] = []
            cluster_vals = np.unique(intent.output)
            for cluster_id in cluster_vals:
                if cluster_id == -1:
                    continue
                mask = np.array(intent.output) == cluster_id
                selected = []
                try:
                    selected = data[cols].dropna()[mask][row_id].tolist()
                except:
                    pass
                pred = Prediction(intent)
                pred.members = selected
                pred.rank_jaccard = jaccard_similarity(pred.members, selections)
                pred.rank_auto_complete = jaccard_similarity(
                    pred.members, selections, True
                )
                pred.membership_stats = get_stats(pred.members, selections)
                pred.info["selected_center"] = pred.info["centers"][cluster_id]
                pred.info["hull"] = get_hull(data[intent.dimensions][mask])
                preds.append(pred)
            return preds
        elif intent.algorithm == "TheilSenRegressor":
            output = np.array(intent.output)

            inlier_mask = output == 1
            outlier_mask = output == 0

            inliers = []

            try:
                inliers = data[cols].dropna()[inlier_mask][row_id].tolist()
            except:
                inliers = []

            inlier_pred = Prediction(intent)
            inlier_pred.members = inliers
            inlier_pred.rank_jaccard = jaccard_similarity(inliers, selections)
            inlier_pred.rank_auto_complete = jaccard_similarity(
                inliers, selections, True
            )
            inlier_pred.membership_stats = get_stats(inliers, selections)
            inlier_pred.info["type"] = "Within"

            outliers = data[cols].dropna()[outlier_mask][row_id].tolist()
            outlier_pred = Prediction(intent)
            outlier_pred.members = outliers
            outlier_pred.rank_jaccard = jaccard_similarity(outliers, selections)
            outlier_pred.rank_auto_complete = jaccard_similarity(
                outliers, selections, True
            )
            outlier_pred.membership_stats = get_stats(outliers, selections)
            outlier_pred.info["type"] = "Outside"

            return [inlier_pred, outlier_pred]
        elif intent.algorithm == "Polynomial Features + TheilSenRegressor":
            output = np.array(intent.output)

            inlier_mask = output == 1
            outlier_mask = output == 0

            inliers = []

            try:
                inliers = data[cols].dropna()[inlier_mask][row_id].tolist()
            except:
                inliers = []

            inlier_pred = Prediction(intent)
            inlier_pred.members = inliers
            inlier_pred.rank_jaccard = jaccard_similarity(inliers, selections)
            inlier_pred.rank_auto_complete = jaccard_similarity(
                inliers, selections, True
            )
            inlier_pred.membership_stats = get_stats(inliers, selections)
            inlier_pred.info["type"] = "Within"

            outliers = data[cols].dropna()[outlier_mask][row_id].tolist()
            outlier_pred = Prediction(intent)
            outlier_pred.members = outliers
            outlier_pred.rank_jaccard = jaccard_similarity(outliers, selections)
            outlier_pred.membership_stats = get_stats(outliers, selections)
            outlier_pred.info["type"] = "Outside"

            return [inlier_pred, outlier_pred]
        elif intent.algorithm == "BNL":
            mask = np.array(intent.output) == 1
            skyline = []

            try:
                skyline = data[cols].dropna()[mask][row_id].tolist()
            except:
                pass

            pred = Prediction(intent)
            pred.members = skyline
            pred.rank_jaccard = jaccard_similarity(pred.members, selections)
            pred.rank_auto_complete = jaccard_similarity(pred.members, selections, True)
            pred.membership_stats = get_stats(pred.members, selections)
            pred.info["edges"] = skyline
            return [pred]
        return []


def get_stats(members, sels):
    stats = {
        # in prediction but not in selection
        "ipns": list(set(members) - set(sels)),
        # in selection but not in prediction
        "isnp": list(set(sels) - set(members)),
        # in both
        "matches": list(set(sels).intersection(set(members))),
    }
    return stats


def getUIDForString(toHash: str):
    md5 = hashlib.md5(toHash.encode())
    return md5.hexdigest()
