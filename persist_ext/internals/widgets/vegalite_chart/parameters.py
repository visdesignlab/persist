import traitlets
from altair import ParameterName


class VariableParam:
    def __init__(self, name, param):
        self._name = name
        if isinstance(param, int):
            self.value = traitlets.Int(default_value=param)
        elif isinstance(param, float):
            self.value = traitlets.Float(default_value=param)
        elif isinstance(param, str):
            self.value = traitlets.Unicode(default_value=param)
        elif isinstance(param, list):
            self.value = traitlets.List(default_value=param)
        elif isinstance(param, dict):
            self.value = traitlets.Dict(default_value=param)
        else:
            raise ValueError(f"Unexpected param type: {type(param)}")


class Parameters(traitlets.HasTraits):
    """
    Traitlet class storing a vegalite params
    """

    def __init__(self, trait_values, InstanceCreator=VariableParam):
        super().__init__()

        if not callable(InstanceCreator):
            raise ValueError(
                f"InstanceCreator must be callable. Got: {InstanceCreator}"
            )

        for key, value in trait_values.items():
            name = get_param_name(value)

            # Add Trait
            self.add_traits(**{key: traitlets.Instance(InstanceCreator)})

            # Set the trait's value.
            setattr(self, key, InstanceCreator(name, value))

    def __repr__(self):
        return f"Params({self.trait_values()})"


# Helper fns for readability
def get_param_name(param):
    if isinstance(param.name, ParameterName):
        return param.name.to_json().strip('"')

    return param.name
