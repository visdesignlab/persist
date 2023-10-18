import copy

import traitlets
from altair import Undefined

from persist_ext.internals.utils.dt_helpers import (
    create_equal_query_for_timeunit,
    create_range_query_for_timeunit,
    extract_timeunit_parts,
    get_time_unit_parts,
    has_timeunit_parts,
    strip_timeunit_parts,
)
from persist_ext.internals.widgets.vegalite_chart.parameters import Parameters

SELECTED_COLUMN_BRUSH = "__selected"
SELECTED_COLUMN_INTENT = "__selected_intent"


def is_param_selection(param):
    select = getattr(param, "select", Undefined)
    return select != Undefined


"""
    Vegalite Store Field Record: [{"field":"year_Year","channel":"x","type":"E"}]
"""


def selected(df):
    return df[SELECTED_COLUMN_BRUSH] | df[SELECTED_COLUMN_INTENT]


class SelectionParam(traitlets.HasTraits):
    value = traitlets.Any(allow_none=True, default_value=None)
    store = traitlets.List([])

    def __init__(self, name, brush_type, value=None, store=[]):
        super().__init__(value=value, store=store)
        self._value = copy.deepcopy(value)
        self._store = copy.deepcopy(store)

        self.name = name
        self.enum_or_range = get_enum_or_range_type(store)
        self.brush_type = brush_type

    @traitlets.validate("value")
    def _fix_empty_like_value(self, proposal):
        new_val = proposal["value"]

        if isinstance(new_val, dict) and len(new_val) == 0:
            return None

        return new_val

    def reset(self, empty=False):
        if empty:
            self.value = None
            self.store = []
        else:
            self.value = copy.deepcopy(self._value)
            self.store = copy.deepcopy(self._store)

    def clear_selection(self):
        self.reset(empty=True)

    def update_selection(self, value, store):
        self.enum_or_range = get_enum_or_range_type(store)
        self.value = value
        self.store = store

    def brush_value(self):
        if len(self.store) == 0 or self.value is None:
            return Undefined

        if self.brush_type == "interval":
            return extract_interval_value(self.store, self.enum_or_range)
        elif self.brush_type == "point":
            return extract_point_value(self.value)
        else:
            raise ValueError(f"Unexpected selection type: {self.brush_type}")

    # vega-altair branch
    def query(self, direction="in"):
        val = self.brush_value()

        q = ""
        print(val)
        if isinstance(val, type(Undefined)) or len(val) == 0:
            q = "index == index"
        elif isinstance(val, dict):  # Intervals
            for col, value in val.items():
                if len(q) > 0:
                    q += " & "

                if has_timeunit_parts(col):
                    timeunit_str = extract_timeunit_parts(col)
                    col = strip_timeunit_parts(col)
                    timeunits = get_time_unit_parts(timeunit_str)
                    q += create_range_query_for_timeunit(col, value, timeunits)
                elif len(value) == 2:
                    q += f"{min(value)} <= {col} <= {max(value)}"
                else:
                    raise ValueError(f"Unhandled selection shape: {val}")
                # if len(q) > 0:
                #     q += ' & '

                # q += f'' # a< b<c

        elif isinstance(val, list):  # Points
            q = ""
            for entry in val:
                if len(q) > 0:
                    q += " | "
                sub_q = ""
                for col, value in entry.items():
                    if len(sub_q) > 0:
                        sub_q += " & "
                    timeunit_str = None
                    if has_timeunit_parts(col):
                        timeunit_str = extract_timeunit_parts(col)
                        col = strip_timeunit_parts(col)
                        timeunits = get_time_unit_parts(timeunit_str)
                        sub_q += create_equal_query_for_timeunit(col, value, timeunits)
                    else:
                        sub_q += f"{col} == {repr(value)}"
                q += f"({sub_q})"

        print(q)
        return f"~({q})" if direction == "out" else q


def extract_point_value(value):
    if not value:
        return None

    if "vlPoint" in value:
        if "or" in value["vlPoint"]:
            return value["vlPoint"]["or"]

    return None


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

            if range_or_enum == "R":
                if not new_value:
                    new_value = {}

                new_value[f["field"]] = v
            elif range_or_enum == "E":
                if not new_value:
                    new_value = []
                if isinstance(v, list):
                    for val in v:
                        new_value.append({f["field"]: val})
                else:
                    raise ValueError(f"Unexpected value type: {v}")
            else:
                raise ValueError(f"Unexpected field type: {f['type']}")

    return new_value


class Selections(Parameters):
    def add_param(self, key, brush_type, value=None, store=[], throw=True):
        if self.has(key):
            if throw:
                raise KeyError(f"Parameter {key} already present")
        else:
            self.add_traits(**{key: traitlets.Instance(SelectionParam)})
            setattr(self, key, SelectionParam(key, brush_type, value, store))


def get_enum_or_range_type(store):
    brs_type = None
    for store_record in store:
        for s in store_record["fields"]:
            b_type = s.get("type", None)
            if not brs_type:
                brs_type = b_type
            elif brs_type != b_type:
                raise ValueError("Multiple brush types detected")

    return brs_type
