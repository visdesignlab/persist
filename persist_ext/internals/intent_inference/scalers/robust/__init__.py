import numpy as np
from sklearn.preprocessing import RobustScaler


def scaler(values: np.ndarray):
    return RobustScaler().fit(values)


def fit_transform(values: np.ndarray):
    return RobustScaler().fit_transform(values)
