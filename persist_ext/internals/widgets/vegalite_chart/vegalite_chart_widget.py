# Link to jonmmease branch! Thanks!
import re

from altair import (
    BrushConfig,
    Chart,
    TopLevelSpec,
    Undefined,
    selection_interval,
    selection_point,
)
from pandas import DataFrame
from traitlets import traitlets

from persist_ext.internals.intent_inference.api import compute_predictions
from persist_ext.internals.utils.logger import logger
from persist_ext.internals.widgets.base.body_widget_base import BodyWidgetBase
from persist_ext.internals.widgets.vegalite_chart.annotation import (
    ANNOTATE_COLUMN_NAME,
    NO_ANNOTATION,
    create_annotation_string,
)
from persist_ext.internals.widgets.vegalite_chart.interaction_types import (
    ANNOTATE,
    CATEGORIZE,
    DROP_COLUMNS,
    FILTER,
    RENAME_COLUMN,
    SELECT,
)
from persist_ext.internals.widgets.vegalite_chart.parameters import (
    Parameters,
    get_param_name,
)
from persist_ext.internals.widgets.vegalite_chart.selection import (
    SELECTED_COLUMN,
    Selections,
)

# prefix to prevnt duplicate signal names
TEST_SELECTION_PREFIX = "__test_selection__"
PRED_HOVER_SIGNAL = TEST_SELECTION_PREFIX
# need this to simulate dummy event stream for intervals
SIGNAL_DISABLE = "[-, -] > -"


class VegaLiteChartWidget(BodyWidgetBase):
    __widget_key = "vegalite"

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

    # Debounce time for fn. This should change based on user input?
    debounce_wait = traitlets.Float(default_value=10).tag(sync=True)

    # Selection store synced with front end. Usually set once by backend, and then updated by front end  # noqa: E501
    params = Parameters({})
    selections = Selections({})

    # Modified dataframe for export
    _data = traitlets.Instance(DataFrame)

    intents = traitlets.List([]).tag(sync=True)

    def __init__(self, chart, data, debounce_wait=200) -> None:
        super(VegaLiteChartWidget, self).__init__(
            chart=chart,
            data=data,
            debounce_wait=debounce_wait,
            widget_key=self.__widget_key,
        )
        self._chart = copy_altair_chart(chart)
        self._data = data.copy(deep=True)

    @traitlets.observe("data")
    def _on_data_update(self, change):
        copy_altair_chart(self.chart)
        new_data = change.new
        chart = copy_altair_chart(self.chart)
        with self.hold_sync():
            chart.data = new_data
            self.chart = chart

    @traitlets.observe("trrack")
    def _on_trrack(self, _change):
        pass

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

    def _copy_vars(self):
        chart = copy_altair_chart(self._chart)
        data = self._persistent_data.copy(deep=True)

        return {"chart": chart, "data": data}

    def _update_copies(self, chart, data, **kwargs):
        chart.data = data
        self.data = data
        self.chart = chart

    def _apply_create(self, interaction, **kwargs):
        return kwargs

    def _apply_select(self, interaction, chart, data, **kwargs):
        selection_name = interaction["name"]
        store = interaction["store"]
        value = interaction["store"]

        selection = self.selections.get(selection_name)

        if not selection:
            raise ValueError(
                f"Selection {selection_name} not found. Are you using named selections?"  # noqa: E501
            )

        selection.update_selection(value, store)

        for param in chart.params:
            chart_param_name = get_param_name(param)

            if chart_param_name == selection_name:
                param.value = selection.brush_value()

                data.loc[
                    data.query(selection.query(direction="in")).index, SELECTED_COLUMN
                ] = True

        return {"chart": chart, "data": data}

    def _apply_filter(self, interaction, chart, data, **kwargs):
        direction = interaction["direction"]

        if direction == "in":
            data = data[data[SELECTED_COLUMN]]
        else:
            data = data[~data[SELECTED_COLUMN]]

        self._clear_all_selection_params(chart)

        return {"chart": chart, "data": data}

    def _apply_rename_column(self, interaction, chart, data, **kwargs):
        previous_column_name = interaction["previousColumnName"]
        new_column_name = interaction["newColumnName"]

        new_col_name_map = {previous_column_name: new_column_name}

        data = self._rename_columns_common(new_col_name_map, data)

        chart = update_field_names(chart, new_col_name_map)

        return {"chart": chart, "data": data}

    def _clear_all_selection_params(self, chart):
        for param in chart.params:
            selection = self.selections.get(get_param_name(param))
            if selection is None:
                continue

            param.value = Undefined
            selection.clear_selection()

    def _update_interactions(self, change):
        chart = copy_altair_chart(self._chart)
        data = chart.data.copy(deep=True)
        _data = data.copy(deep=True)

        if SELECTED_COLUMN not in _data:
            _data[SELECTED_COLUMN] = False

        with self.hold_sync():
            interactions = change.new

            for interaction in interactions:
                _type = interaction["type"]

                if _type == SELECT:
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
                            _data.loc[
                                _data.query(selection.query(direction="in")).index,
                                SELECTED_COLUMN,
                            ] = True
                elif _type == FILTER:
                    direction = interaction["direction"]

                    for sel in chart.params:
                        name = get_param_name(sel)
                        selection = self.selections.get(name)

                        if selection is None:
                            raise ValueError("selection should be defined")

                        query_str = selection.query(direction=direction)
                        data = data.query(query_str)
                        selection.clear_selection()
                        sel.value = Undefined

                        _data = _data[_data[SELECTED_COLUMN]]
                        _data[SELECTED_COLUMN] = False
                elif _type == ANNOTATE:
                    text = interaction["text"]
                    created_on = interaction["createdOn"]
                    annotation_str = create_annotation_string(text, created_on)
                    if ANNOTATE_COLUMN_NAME not in data:
                        data[ANNOTATE_COLUMN_NAME] = NO_ANNOTATION

                    if ANNOTATE_COLUMN_NAME not in _data:
                        _data[ANNOTATE_COLUMN_NAME] = NO_ANNOTATION

                    # Assume no tooltips are present for now
                    for sel in chart.params:
                        name = get_param_name(sel)
                        selection = self.selections.get(name)

                        if selection is None:
                            raise ValueError("selection should be defined")

                        query_str = selection.query(direction="in")
                        query_mask = data.query(query_str).index

                        def _append_annotations(val):
                            if val == NO_ANNOTATION:
                                return annotation_str
                            else:
                                return f"{val} | {annotation_str}"

                        data.loc[query_mask, ANNOTATE_COLUMN_NAME] = data.loc[
                            query_mask, ANNOTATE_COLUMN_NAME
                        ].apply(_append_annotations)
                        _data[ANNOTATE_COLUMN_NAME] = data[ANNOTATE_COLUMN_NAME]

                        chart = chart.encode(tooltip=f"{ANNOTATE_COLUMN_NAME}:N")

                        selection.clear_selection()
                        sel.value = Undefined
                        _data[SELECTED_COLUMN] = False
                elif _type == RENAME_COLUMN:
                    previous_column_name = interaction["previousColumnName"]
                    new_column_name = interaction["newColumnName"]

                    data = data.rename(columns={previous_column_name: new_column_name})
                    _data = _data.rename(
                        columns={previous_column_name: new_column_name}
                    )

                    # Maybe take this off?
                    chart.data = DataFrame().reindex_like(data)

                    chart_json = chart.to_json()
                    # replace "A" with "B"
                    chart_json = re.sub(
                        re.escape(f'"{previous_column_name}"'),
                        re.escape(f'"{new_column_name}"'),
                        chart_json,
                    )
                    chart_json = re.sub(
                        re.escape(f"_{previous_column_name}"),
                        re.escape(f"_{new_column_name}"),
                        chart_json,
                    )
                    chart = Chart.from_json(chart_json)
                elif _type == DROP_COLUMNS:
                    columns = interaction["columns"]
                    if len(columns) > 0:
                        data = data.drop(columns, axis=1)
                        _data = _data.drop(columns, axis=1)
                elif _type == CATEGORIZE:
                    category = interaction["category"]
                    option = interaction["option"]

                    if category not in data:
                        data[category] = "None"
                        _data[category] = "None"

                    for sel in chart.params:
                        name = get_param_name(sel)
                        selection = self.selections.get(name)

                        if selection is None:
                            raise ValueError("selection should be defined")

                        query_str = selection.query(direction="in")
                        query_mask = data.query(query_str).index

                        data.loc[query_mask, category] = f"_{option}"
                        _data[category] = data[category]

                        chart = chart.encode(shape=f"{category}:N")
                        chart = chart.encode(color=f"{category}:N")

                        selection.clear_selection()
                        sel.value = Undefined
                        _data[SELECTED_COLUMN] = False
                else:
                    logger.info("---")
                    logger.info("Misc")
                    logger.info(interaction)
                    logger.info("---")

            self.data = data
            chart.data = data
            self.chart = chart
            self._data = _data
        self.compute_intents()

    def compute_intents(self):
        features = []
        for _, enc in self.chart.encoding.to_dict().items():
            field = enc.get("field", None)
            if field is not None:
                features.append(field)
        selections = []
        if SELECTED_COLUMN in self._data:
            selections = self._data[self._data[SELECTED_COLUMN]]["index"].tolist()
        preds = []
        if len(selections) > 0 and len(features) > 0:
            preds = compute_predictions(
                self._data.dropna(), selections, features, row_id_label="index"
            )
        self.intents = preds

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


composite_chart_indicators = ["layer", "concat", "hconcat", "vconcat"]


def is_composite_chart(chart):
    for prop in composite_chart_indicators:
        if hasattr(chart, prop):
            return True
    return False


def apply_fn_to_chart(chart, fn, *args, **kwargs):
    for prop in composite_chart_indicators:
        for child in getattr(chart, prop, []):
            apply_fn_to_chart(child, fn, *args, **kwargs)

    fn(chart, *args, **kwargs)


def update_field_names(chart, col_map):
    chart_json = chart.to_json()

    for previous_name, new_name in col_map.items():
        # replace fields like `"Horsepower"`
        chart_json = re.sub(
            re.escape(f'"{previous_name}"'), re.escape(f'"{new_name}"'), chart_json
        )
        # replace fields like `_Horsepower`
        chart_json = re.sub(
            re.escape(f"_{previous_name}"), re.escape(f"_{new_name}"), chart_json
        )

    chart = Chart.from_json(chart_json)
    return chart
