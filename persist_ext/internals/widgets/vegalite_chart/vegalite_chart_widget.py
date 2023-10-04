# Link to jonmmease branch! Thanks!

import altair as alt
from altair import (
    BrushConfig,
    Chart,
    Undefined,
    selection_interval,
    selection_point,
)
from traitlets import traitlets

from persist_ext.internals.utils.entry_paths import get_widget_esm_css
from persist_ext.internals.utils.logger import logger
from persist_ext.internals.widgets.trrack_widget_base import BodyWidgetBase
from persist_ext.internals.widgets.vegalite_chart.interaction_types import (
    ANNOTATE,
    CREATE,
    FILTER,
    RENAME_COLUMN,
    SELECT,
)
from persist_ext.internals.widgets.vegalite_chart.parameters import (
    Parameters,
    get_param_name,
)
from persist_ext.internals.widgets.vegalite_chart.selection import (
    Selections,
)

# prefix to prevnt duplicate signal names
TEST_SELECTION_PREFIX = "__test_selection__"
# need this to simulate dummy event stream for intervals
SIGNAL_DISABLE = "[-, -] > -"


class VegaLiteChartWidget(BodyWidgetBase):
    _esm, _css = get_widget_esm_css("vegalite")

    cell_id = traitlets.Unicode("").tag(sync=True)  # to sync with trrack

    # altair chart object to observe and update
    # Any new interactions should modify this
    chart = traitlets.Instance(Chart)

    # Original chart object. This should never change
    _chart = traitlets.Instance(Chart)

    # json spec of altair object to render on front end.
    # This should be chart object to_json()
    spec = traitlets.Dict().tag(sync=True)

    # List of all parameter names
    param_names = traitlets.List().tag(sync=True)

    # List of selection parameter names
    selection_names = traitlets.List().tag(sync=True)

    # Debounce time for fn. This should change based on user input?
    debounce_wait = traitlets.Float(default_value=10).tag(sync=True)

    # Selection store synced with front end. Usually set once by backend, and then updated by front end  # noqa: E501
    params = Parameters({})
    selections = Selections({})

    def __init__(self, chart, data, debounce_wait=200) -> None:
        super(VegaLiteChartWidget, self).__init__(
            chart=chart, data=data, debounce_wait=debounce_wait
        )
        self._chart = copy_altair_chart(chart)

    @traitlets.observe("data")
    def _on_data_update(self, change):
        copy_altair_chart(self.chart)
        # with self.hold_sync():
        #     chart.data = new_data
        # self.chart = chart

    @traitlets.observe("trrack")
    def _on_trrack(self, change):
        logger.info("Vis update")

    @traitlets.observe("chart")
    def _on_chart_change(self, change):
        """
        Responds to changes in `chart` object
        And setup a reactive widget instance
        """
        param_names = []  # to init `param_names`
        selection_names = []  # to init `selection_names`
        selections = {}
        params = {}

        new_chart = change.new  # Get the new chart

        # Loop over all parameters
        for param in new_chart.params:
            name = get_param_name(param)  # Get parameter name
            param_names.append(name)  # Add it to list of parameter names

            if name.startswith(TEST_SELECTION_PREFIX):
                continue

            select = getattr(
                param, "select", None
            )  # Try and get "select" key from parameter

            if select:  # if it exists, this is a selection-parameter
                selections[name] = param

                selection_names.append(
                    name
                )  # Add the parameter to list of selection-parameters

            else:  # This is a value-parameter
                params[name] = param

        selections = selections
        params = params

        with self.hold_sync():
            self.spec = new_chart.to_dict()
            self.param_names = param_names
            self.selection_names = selection_names
            self.selections = Selections(selections)
            self.params = Parameters(params)

    @traitlets.observe("interactions")
    def _update_interactions(self, change):
        chart = copy_altair_chart(self._chart)
        with self.hold_sync():
            interactions = change.new

            for interaction in interactions:
                _type = interaction["type"]

                if _type == CREATE:
                    continue
                elif _type == SELECT:
                    selection_name = interaction["name"]

                    value = interaction["value"]
                    store = interaction["store"]

                    selection = self.selections.get(selection_name)

                    if not selection:
                        raise ValueError(
                            f"Selection {selection_name} not found. Are you using named selections?"  # noqa: E501
                        )

                    selection.update_selection(value, store)

                    for sel in chart.params:
                        name = get_param_name(sel)
                        if name == selection_name:
                            sel.value = selection.brush_value()
                elif _type == FILTER:
                    direction = interaction["direction"]

                    for sel in chart.params:
                        name = get_param_name(sel)
                        selection = self.selections.get(name)

                        if selection is None:
                            raise ValueError("selection should be defined")

                        test_selection_param = create_test_selection_param(
                            name,
                            selection.type,
                            selection.brush_value(),
                            selection.encodings,
                        )

                        chart = chart.add_params(test_selection_param)
                        if direction == "out":
                            chart = chart.transform_filter(
                                {"not": test_selection_param}
                            )
                        else:
                            chart = chart.transform_filter(test_selection_param)

                        selection.clear_selection()
                        sel.value = Undefined
                elif _type == ANNOTATE:
                    text = interaction["text"]
                    interaction["createdOn"]

                    # Assume no tooltips are present for now
                    for sel in chart.params:
                        name = get_param_name(sel)
                        selection = self.selections.get(name)

                        if selection is None:
                            raise ValueError("selection should be defined")

                        test_selection_param = create_test_selection_param(
                            name,
                            selection.type,
                            selection.brush_value(),
                            selection.encodings,
                        )

                        chart = chart.add_params(test_selection_param)

                        chart = chart.encode(
                            tooltip=alt.condition(
                                test_selection_param, alt.value(text), alt.value("-")
                            )
                        )

                        selection.clear_selection()
                        sel.value = Undefined
                elif _type == RENAME_COLUMN:
                    previous_column_name = interaction["previousColumnName"]
                    new_column_name = interaction["newColumnName"]

                    with self.hold_sync():
                        self.rename_column(
                            previous_column_name=previous_column_name,
                            new_column_name=new_column_name,
                        )
                        chart_json = chart.to_json()
                        chart_json = chart_json.replace(
                            f'"{previous_column_name}"', f'"{new_column_name}"'
                        )
                        chart_json = chart_json.replace(
                            f"_{previous_column_name}", f"_{new_column_name}"
                        )
                        chart = alt.Chart.from_json(chart_json)
                else:
                    logger.info("---")
                    logger.info("Misc")
                    logger.info(interaction)
                    logger.info("---")

        self.chart = chart

    def _reset_chart(self):
        """
        Resets the chart to the original chart
        """
        self.chart = self._chart


def copy_altair_chart(chart):
    return chart.copy(deep=True)


def create_test_selection_param(selection_name, brush_type, brush_value, encodings):
    selection_name = TEST_SELECTION_PREFIX + selection_name
    if brush_type == "interval":
        return selection_interval(
            name=selection_name,
            value=brush_value,
            encodings=encodings,
            on=SIGNAL_DISABLE,
            mark=BrushConfig(fillOpacity=0, strokeOpacity=0),
        )

    return selection_point(
        name=selection_name,
        value=brush_value,
        encodings=encodings,
        on=SIGNAL_DISABLE,
    )
