# Link to jonmmease branch! Thanks!
import json

import altair as alt
from altair import TopLevelSpec
from altair.utils.selection import IndexSelection, IntervalSelection, PointSelection
from traitlets import traitlets

from persist_ext.internals.utils.entry_paths import get_widget_esm_css
from persist_ext.internals.utils.logger import logger
from persist_ext.internals.widgets.trrack_widget_base import WidgetWithTrrack


class Params(traitlets.HasTraits):
    """
    Traitlet class storing a vegalite params
    """

    def __init__(self, trait_values):
        super().__init__()

        for key, value in trait_values.items():
            if isinstance(value, int):
                traitlet_type = traitlets.Int()
            elif isinstance(value, float):
                traitlet_type = traitlets.Float()
            elif isinstance(value, str):
                traitlet_type = traitlets.Unicode()
            elif isinstance(value, list):
                traitlet_type = traitlets.List()
            elif isinstance(value, dict):
                traitlet_type = traitlets.Dict()
            else:
                raise ValueError(f"Unexpected param type: {type(value)}")

            # Add the new trait.
            self.add_traits(**{key: traitlet_type})

            # Set the trait's value.
            setattr(self, key, value)

    def __repr__(self):
        return f"Params({self.trait_values()})"


class Selections(traitlets.HasTraits):
    """
    Traitlet class storing selections from vegalite
    """

    def _init__(self, vals):
        super().__init__()

        traitlet_type = None
        for k, v in vals.items():
            if isinstance(v, IndexSelection):
                traitlet_type = traitlets.Instance(IndexSelection)
            elif isinstance(v, PointSelection):
                traitlet_type = traitlets.Instance(PointSelection)
            elif isinstance(v, IntervalSelection):
                traitlet_type = traitlets.Instance(IntervalSelection)
            else:
                raise ValueError(f"Unexpected selection type: {type(v)}")

            if traitlet_type:
                self.add_traits(**{k: traitlet_type})
            else:
                raise ValueError(f"Traitlet type of {k} should not be none")

            setattr(self, k, v)


class VegaLiteChartWidget(WidgetWithTrrack):
    _esm, _css = get_widget_esm_css("vegalite")

    cell_id = traitlets.Unicode("").tag(sync=True)  # to sync with trrack

    # altair chart object to observe and update
    # Any new interactions should modify this
    chart = traitlets.Instance(TopLevelSpec)

    # Original chart object. This should never change
    _chart = traitlets.Instance(TopLevelSpec)

    # json spec of altair object to render on front end.
    # This should be chart object to_json()
    spec = traitlets.Dict().tag(sync=True)

    # List of all parameter names
    param_names = traitlets.List().tag(sync=True)

    # List of selection parameter names
    selection_names = traitlets.List().tag(sync=True)
    # Selection object map
    param_object_map = traitlets.Dict().tag(sync=True)

    # Map of selection parameter name to type. To easily lookup selection
    _selection_type_map = traitlets.Dict().tag(sync=True)

    # Debounce time for fn. This should change based on user input?
    debounce_wait = traitlets.Float(default_value=10).tag(sync=True)

    # Selection store synced with front end. Usually set once by backend, and then updated by front end
    selections = traitlets.Dict().tag(sync=True)

    def __init__(self, chart, debounce_wait=200) -> None:
        super().__init__(chart=chart, debounce_wait=debounce_wait)
        self.params = Params({})
        self._chart = copy_altair_chart(chart)

    @traitlets.observe("trrack")
    def _on_trrack(self, change):
        logger.info("Vis update")

    @traitlets.observe("chart")
    def _on_chart_change(self, change):
        """
        Responds to changes in `chart` object
        And setup a reactive widget instance
        """
        initial_selections = {}  # To init `selections`
        param_names = []  # to init `param_names`
        selection_names = []  # to init `selection_names`
        selection_type_map = {}  # to init `_selection_type_map`
        param_object_map = {}

        new_chart = change.new  # Get the new chart

        # Loop over all parameters
        for param in new_chart.params:
            name = get_param_name(param)  # Get parameter name
            param_names.append(name)  # Add it to list of parameter names

            select = getattr(
                param, "select", None
            )  # Try and get "select" key from parameter

            if select:  # if it exists, this is a selection-parameter
                select_type = (
                    select.type
                )  # get type of selection ("point" or "interval")

                selection_names.append(
                    name
                )  # Add the parameter to list of selection-parameters
                selection_type_map[
                    name
                ] = select_type  #  Update the map with proper type of selection

                if select_type == "interval":  # Handle "interval" selections
                    pass
                elif select_type == "point":  # Handle "point" selections
                    pass
                else:
                    raise ValueError(f"{select_type} is not recognized")

                initial_selections[name] = {
                    "value": None,
                    "store": [],
                }  # assign initial selection as empty
            else:  # This is a value-parameter
                pass

            param_object_map[name] = json.loads(param.to_json())

        with self.hold_sync():
            self.spec = new_chart.to_dict()
            self.param_names = param_names
            self.selection_names = selection_names
            self._selection_type_map = selection_type_map
            self.selections = initial_selections
            self.param_object_map = param_object_map

    @traitlets.observe("selections")
    def _on_change_selections(self, change):
        """
        This is listening to changes in `selections`. Changes to `selections` come from frontend
        """
        for selection_name, selection_dict in change.new.items():
            selection_dict["value"]
            selection_dict["store"]

            selection_type = self._selection_type_map[selection_name]

            if selection_type == "interval":
                pass
            else:
                pass

    # TODO: Test this sync
    @traitlets.observe("interactions")
    def _update_interactions(self, change):
        chart = copy_altair_chart(self._chart)
        with self.hold_sync():
            interactions = change.new

            for interaction in interactions:
                _type = interaction["type"]

                if _type == "select":
                    selection_name = interaction["name"]
                    selected = interaction["selected"]
                    selection_value = selected["value"]

                    for selection in chart.params:
                        name = get_param_name(selection)
                        if name == selection_name:
                            selection.value = selection_value

        self.chart = chart

    def _reset_chart(self):
        """
        Resets the chart to the original chart
        """
        self.chart = self._chart


def copy_altair_chart(chart: TopLevelSpec):
    return alt.Chart.from_dict(chart.to_dict())


# Helper fns for readability
def get_param_name(param):
    name = param.name

    if isinstance(name, alt.ParameterName):
        name = name.to_json().strip('"')

    return name
