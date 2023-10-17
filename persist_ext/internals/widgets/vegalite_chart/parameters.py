import traitlets
from altair import ParameterName


class VariableParam(traitlets.HasTraits):
    value = traitlets.Any(allow_none=True)

    def __init__(self, name, param):
        super().__init__(value=param)
        self.name = name
        self.original_value = param

    def reset(self):
        self.value = self.original_value

    def update_param_in_chart(self, chart):
        pass


class Parameters(traitlets.HasTraits):
    """
    Traitlet class storing a vegalite params
    """

    def add_param(self, key, value, throw=True):
        if self.has(key):
            if throw:
                raise KeyError(f"Parameter {key} already present")
        else:
            self.add_traits(**{key: traitlets.Instance(VariableParam)})
            setattr(self, key, self.instance_creator(key, value))

    def __repr__(self):
        return f"Params({self.trait_values()})"

    def get(self, key):
        return getattr(self, key, None)

    def has(self, key):
        return getattr(self, key, None) is not None

    def all(self):
        return self.trait_values()

    def names(self):
        return self.trait_names()

    def update(self, key, value):
        if not self.has(key):
            raise ValueError(f"param {key} does not exist")

        self.get(key).value = value


# Helper fns for readability
def get_param_name(param):
    if isinstance(param.name, ParameterName):
        return param.name.to_json().strip('"')

    return param.name
