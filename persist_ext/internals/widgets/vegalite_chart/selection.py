from altair import Undefined

from persist_ext.internals.widgets.vegalite_chart.parameters import Parameters


def is_param_selection(param):
    select = getattr(param, "select", Undefined)
    return select != Undefined


"""
    Vegalite Store Field Record: [{"field":"year_Year","channel":"x","type":"E"}]
"""


class SelectionParam:
    def __init__(self, name, selection):
        self._selection = selection
        if not isinstance(selection, dict):
            selection = selection.to_dict()

        select = selection.get("select", None)

        if not select:
            raise ValueError(
                f"Selection must have a select field. Selection: {selection}"
            )

        if not (select.get("fields", None) or select.get("encodings", None)):
            raise ValueError(
                f"Selection must have fields or encodings. Selection {selection.get('select', None)} doesn't have either."  # noqa: E501
            )

        self.name = name
        self.selection = selection
        self.type = select.get("type", None)
        self.encodings = select.get("encodings", [])

        self.brush_type = None
        self.value = None
        self.store = None

    def clear_selection(self):
        self.value = None
        self.store = None

    def update_selection(self, value, store):
        self.brush_type = get_brush_handler_type(store)

        self.value = value
        self.store = store

    def brush_value(self):
        if self.type == "interval":
            return extract_interval_value(self.store, self.brush_type)
        elif self.type == "point":
            raise ValueError("Point selection not implemented")
        else:
            raise ValueError(f"Unexpected selection type: {self.type}")


def extract_interval_value(store, range_or_enum):
    if not store:
        return None

    new_value = None

    for store_entry in store:
        fields = store_entry.get("fields", [])
        values = store_entry.get("values", [])

        for i in range(0, len(fields)):
            f = fields[i]
            v = values[i]

            if f["type"] == "R":
                if not new_value:
                    new_value = {}

                new_value[f["field"]] = v
            elif f["type"] == "E":
                if not new_value:
                    new_value = []
                for val in v:
                    new_value.append({f["field"]: val})
            else:
                raise ValueError(f"Unexpected field type: {f['type']}")

    return new_value

    # if not range_or_enum or range_or_enum == "R":
    #     return value
    # else:
    #     new_value = []
    #     for field_obj in
    #     return new_value


class Selections(Parameters):
    def __init__(self, trait_values):
        super().__init__(trait_values, SelectionParam)

    def get(self, key):
        return getattr(self, key, None)


def get_brush_handler_type(store):
    brs_type = None
    for store_record in store:
        for s in store_record["fields"]:
            b_type = s.get("type", None)
            if not brs_type:
                brs_type = b_type
            elif brs_type != b_type:
                raise ValueError("Multiple brush types detected")

    return brs_type
