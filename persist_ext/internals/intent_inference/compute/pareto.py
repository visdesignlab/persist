from paretoset import paretoset


def pareto(data, sense):
    mask = paretoset(data, sense)
    return mask.astype(int)
