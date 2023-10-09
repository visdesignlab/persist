import numpy as np
from sklearn.linear_model import TheilSenRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures


def regression_params():
    return [2, 4]


def regression(
    data,
    theilsen_max_iter=100,
    order="auto",
    threshold_multiplier=2,
):
    if order == "auto":
        order = get_best_degree(data)
    elif not isinstance(order, int):
        order = 1

    reg = Pipeline(
        [
            ("quad", PolynomialFeatures(degree=order)),
            (
                "linear",
                TheilSenRegressor(max_subpopulation=50, max_iter=theilsen_max_iter),
            ),
        ]
    )

    numDims = np.size(data, 1)

    X = data[:, 0 : numDims - 1]  # noqa
    Y = data[:, numDims - 1]

    inlier_mask = np.ones(np.size(data, 0), dtype=bool)

    mask_length = 0
    threshold = 0

    for _ in range(10):
        if mask_length == sum(inlier_mask):
            break
        else:
            mask_length = sum(inlier_mask)

        inlier_mask = inlier_mask.astype(bool)
        i_X = X[inlier_mask]
        i_Y = Y[inlier_mask]

        if i_X.shape[0] == 0:
            inlier_mask = inlier_mask.astype(int)
            break

        reg.fit(i_X, i_Y)
        ts = reg.predict(X)

        residuals = abs(ts - Y)

        inlier_residuals = abs(reg.predict(i_X) - i_Y)

        threshold = np.median(inlier_residuals)

        within = residuals < (threshold_multiplier * threshold)

        inlier_mask = within.astype(int)

    return reg, inlier_mask, threshold_multiplier * threshold, order


def get_best_degree(data):
    degrees = range(1, 6)

    errors = []

    degrees = list(degrees)

    for deg in degrees:
        reg = Pipeline(
            [
                ("quad", PolynomialFeatures(degree=deg)),
                (
                    "linear",
                    TheilSenRegressor(max_subpopulation=50, max_iter=300),
                ),
            ]
        )

        numDims = np.size(data, 1)

        X = data[:, 0 : numDims - 1]  # noqa
        Y = data[:, numDims - 1]

        reg.fit(X, Y)

        out = reg.predict(X)

        Sr = np.sum(np.square(Y - out))

        errors.append(Sr)

    min_degree = degrees[np.argmin(errors)]

    return min_degree
