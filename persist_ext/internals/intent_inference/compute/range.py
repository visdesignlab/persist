import pandas as pd
from sklearn import tree


def range_alg(data: pd.DataFrame, selection, max_depth=None):
    clf = tree.DecisionTreeClassifier(max_depth=max_depth)

    clf.fit(data, selection)

    rules = get_decision_paths(clf, data, selection)

    return rules


def get_mask_from_exp(data, exp):
    feature, op, val, mask = None, None, None, None
    if ">=" in exp:
        op = ">="
        feature, val = exp.split(">=")
    else:
        op = "<="
        feature, val = exp.split("<=")
    feature = feature.strip()
    val = float(val.strip())
    if op == ">=":
        mask = data[feature] >= val
    else:
        mask = data[feature] <= val

    return mask


def get_mask_from_rules(data, rules):
    mask = None

    for rule in rules:
        m = None
        for exp in rule:
            if m is None:
                m = get_mask_from_exp(data, exp)
            else:
                m &= get_mask_from_exp(data, exp)
        if mask is None:
            mask = m
        else:
            mask |= m
    return mask


def get_decision_paths(model: tree.DecisionTreeClassifier, data, selection):
    selected_rows = data[selection]

    paths = set()

    d_path = model.decision_path(selected_rows)

    leaf_id = model.apply(selected_rows)
    feature = model.tree_.feature
    threshold = model.tree_.threshold

    for sample_id in range(len(selected_rows.index)):
        node_idx = d_path.indices[
            d_path.indptr[sample_id] : d_path.indptr[sample_id + 1]  # noqa
        ]

        rules = []

        for node_id in node_idx:
            if leaf_id[sample_id] == node_id:
                continue

            sign = None
            if selected_rows.iloc[sample_id, feature[node_id]] <= threshold[node_id]:
                sign = "<="
            else:
                sign = ">="

            rule = (
                data.columns[feature[node_id]]
                + sign
                + str(round(threshold[node_id], 2))
            )

            rules.append(rule)
        paths.add(tuple(rules))

    paths = [[rule for rule in path] for path in paths]

    mask = get_mask_from_rules(data, paths)

    return paths, mask
