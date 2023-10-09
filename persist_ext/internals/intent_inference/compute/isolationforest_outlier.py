import numpy as np
from sklearn.ensemble import IsolationForest

from ..scalers.robust import fit_transform


def isolationforest_params():
    return [0.1, 0.2, 0.3, 0.4, 0.5, "auto"]


def isolationforest_outlier(data: np.ndarray, contamination=0.1):
    scaled_data = fit_transform(data)

    clf = IsolationForest(contamination=contamination)
    clf.fit(scaled_data)

    labels = clf.fit_predict(scaled_data)

    labels = np.where(labels != -1, 0, labels)

    return clf, labels
