# NOTE: Link to jonmmease branch! Thanks!

import re
import altair as alt
import pandas as pd  # noqa: F401
from altair import (
    Chart,
    TopLevelSpec,
    Undefined,
)

from pandas import DataFrame
from traitlets import traitlets
from persist_ext.internals.data.idfy import ID_COLUMN


from persist_ext.internals.intent_inference.api import compute_predictions
from persist_ext.internals.widgets.base.body_widget_base import BodyWidgetBase
from persist_ext.internals.widgets.interactions.annotation import ANNOTATE_COLUMN_NAME
from persist_ext.internals.widgets.interactions.selection import (
    SELECTED_COLUMN_BRUSH,
    SELECTED_COLUMN_INTENT,
    Selections,
)
from persist_ext.internals.widgets.vegalite_chart.parameters import (
    Parameters,
    get_param_name,
)
from persist_ext.internals.widgets.vegalite_chart.utils import (
    PRED_HOVER_SIGNAL,
    TEST_SELECTION_PREFIX,
    add_new_nominal_encoding_recursive,
    add_prediction_hover_test_recursive,
    add_tooltip_encoding_recursive,
    check_encodings_for_utc_recursive,
    get_encodings_recursive,
)

# prefix to prevnt duplicate signal namesvegalitecv
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
    spec = traitlets.Any().tag(sync=True)

    # List of variable parameter names
    param_names = traitlets.List().tag(sync=True)

    # List of selection parameter names
    selection_names = traitlets.List().tag(sync=True)
    selection_types = traitlets.Dict().tag(sync=True)

    # Debounce time for fn. This should change based on user input?
    debounce_wait = traitlets.Float(default_value=300).tag(sync=True)

    # Modified dataframe for export
    _data = traitlets.Instance(DataFrame)

    def __init__(self, chart, data, debounce_wait=250) -> None:
        self.params = Parameters()
        self.selections = Selections()

        chart = chart.add_params(alt.param(name=PRED_HOVER_SIGNAL, value=[]))

        super(VegaLiteChartWidget, self).__init__(
            chart=chart,
            data=data,
            debounce_wait=debounce_wait,
            widget_key=self.__widget_key,
        )
        check_encodings_for_utc_recursive(chart)
        self._chart = copy_altair_chart(chart)
        self._data = data.copy(deep=True)
        self.intent_cache = dict()

        # Selection store synced with front end. Usually set once by backend, and then updated by front end  # noqa: E501

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
        with self.hold_sync():
            new_chart = change.new  # Get the new chart

            # Loop over all parameters
            for param in new_chart.params:
                name = get_param_name(param)  # Get parameter name

                if name.startswith(TEST_SELECTION_PREFIX):
                    continue

                select = getattr(
                    param, "select", None
                )  # Try and get "select" key from parameter

                if select is None:
                    self.params.add_params(name, param, throw=False)
                elif self.selections.has(name):
                    continue
                else:
                    select = (
                        select.to_dict() if not isinstance(select, dict) else select
                    )
                    selection_type = select
                    if isinstance(selection_type, dict) and "type" in selection_type:
                        selection_type = select["type"]
                    self.selections.add_param(name, selection_type, throw=False)
                    self.selection_types[name] = selection_type

            self.spec = new_chart.to_json()

            self.selection_names = self.selections.names()

            self.param_names = self.params.names()

    def _copy_vars(self):
        chart = copy_altair_chart(self._chart)
        data = self._persistent_data.copy(deep=True)

        return data, chart

    def _finish(self):
        self.loading_intents = True
        with self.hold_sync():
            self.compute_intents()
            self.loading_intents = False

    def _update_copies(self, data, chart):
        chart.data = data
        self.data = data
        self.chart = chart

    def _to_cache(self, data, chart):
        # data = data.to_parquet(compression="brotli") # maybe uncomment when its an issue
        data = data.copy(deep=True)
        chart = copy_altair_chart(chart)
        return data, chart

    def _from_cache(self, data, chart):
        # data = pd.read_parquet(BytesIO(data))
        data = data.copy(deep=True)
        chart = copy_altair_chart(chart)
        return data, chart

    def _get_data(self, data, *args, **kwargs):
        return data

    # Interactions
    def _apply_create(self, _interaction, data, chart):
        return data, chart

    def _clear_selection_param(self, chart, selection_spec_name, param_list_idx):
        self._update_selection_param(
            chart=chart,
            selection_spec_name=selection_spec_name,
            param_list_idx=param_list_idx,
        )

    def _update_selection_param(
        self, chart, selection, param_list_idx, value=None, store=[]
    ):
        # get chart spec for selection
        selection_spec = chart.params[param_list_idx]

        if value is None and len(store) == 0:
            # clear if no value and empty store
            selection.clear_selection()
            selection_spec.value = Undefined
        else:
            # Set value if provided
            selection.update_selection(value, store)
            selection_spec.value = selection.brush_value()

        return chart

    # Apply methods
    def _clear_selections(self, data, chart):
        data = self._clear_selection_data(data)
        chart = self._clear_all_selection_params(chart)

        return data, chart

    def _clear_all_selection_params(self, chart):
        chart.encoding.color = self._chart.encoding.color

        for param in chart.params:
            selection = self.selections.get(get_param_name(param))
            if selection is None:
                continue

            param.value = Undefined
            selection.clear_selection()

        return chart

    def _apply_select(self, interaction, data, chart):
        selection_name = interaction["name"]
        store = interaction["store"]
        value = interaction["value"]

        if selection_name == "index_selection":
            selection_name = self.selection_names[0]

        selection = self.selections.get(selection_name)

        if not selection:
            raise ValueError(
                f"Selection {selection_name} not found. Are you using named selections?"  # noqa: E501
            )

        # Get index of selection in chart spec
        param_idx = [get_param_name(p) for p in chart.params].index(selection.name)

        # Update selection traitlet and chart spec together
        chart = self._update_selection_param(chart, selection, param_idx, value, store)

        data[SELECTED_COLUMN_BRUSH] = False
        data.loc[
            data.query(selection.query(direction="in")).index, SELECTED_COLUMN_BRUSH
        ] = True

        return data, chart

    def _apply_intent(self, interaction, data, chart):
        intent = interaction["intent"]

        data, chart = self._clear_selections(data, chart)
        print(intent)
        data[SELECTED_COLUMN_INTENT] = False
        data.loc[data[ID_COLUMN].isin(intent["members"]), SELECTED_COLUMN_INTENT] = True

        chart = chart.encode(
            color=alt.condition(
                f"if(datum.{SELECTED_COLUMN_INTENT}, true, false)",
                alt.value("steelblue"),
                alt.value("gray"),
            )
        )

        chart = add_prediction_hover_test_recursive(chart, "opacity", None, None)

        return data, chart

    def _apply_filter(self, interaction, data, chart):
        direction = interaction["direction"]

        data = self._filter_common(data, direction)

        self._clear_all_selection_params(chart)

        return data, chart

    def _apply_rename_column(self, interaction, data, chart):
        data = self._rename_columns_common(data, interaction)

        rename_column_map = interaction["renameColumnMap"]

        chart = update_field_names(chart, rename_column_map)

        return data, chart

    def _apply_drop_columns(self, interaction, data, chart):
        columns = interaction["columns"]
        if columns is None:
            columns = []

        data = self._drop_columns_common(data, columns)

        return data, chart

    def _apply_categorize(self, interaction, data, chart):
        data = self._categorize_common(data, interaction)
        data, chart = self._clear_selections(data, chart)

        category = interaction["category"]

        chart = add_new_nominal_encoding_recursive(
            chart,
            category,
        )

        return data, chart

    def _apply_annotate(self, interaction, data, chart):
        data = self._annotate_common(data, interaction)
        data, chart = self._clear_selections(data, chart)

        chart = add_tooltip_encoding_recursive(chart, ANNOTATE_COLUMN_NAME)

        return data, chart

    def compute_intents(self):
        if len(self.interactions) == 0:
            return

        last_interaction_id = self.interactions[-1]["id"]

        preds = self.intent_cache.get(last_interaction_id, None)

        if preds is None:
            preds = []
            features = []
            get_encodings_recursive(self.chart, lambda x: features.append(x))
            features = list(filter(lambda x: x is not None, set(features)))

            selections = []

            if SELECTED_COLUMN_BRUSH in self.data:
                selections = self.data[self.data[SELECTED_COLUMN_BRUSH]][
                    self.df_id_column_name
                ].tolist()

            print(selections)

            if len(selections) > 0 and len(features) > 0:
                preds = compute_predictions(
                    self.data.dropna(),
                    selections,
                    features,
                    row_id_label=self.df_id_column_name,
                )

            self.intent_cache[last_interaction_id] = preds

        with self.hold_sync():
            if preds is not None and len(preds) > 0:
                self.chart = add_prediction_hover_test_recursive(
                    self.chart, "opacity", 0.7, 0.1
                )

            self.intents = preds

    def _apply_sortby_column(self, data, chart):
        return data, chart

    def _apply_reorder_column(self, data, _):
        return data, _

    def _apply_edit_cell(self, data, _):
        return data, _

    def _apply_column_type_change(self, data, _):
        return data, _

    def _reset_chart(self):
        """
        Resets the chart to the original chart
        """
        self.chart = self._chart


def copy_altair_chart(chart):
    return chart.copy(deep=True)


composite_chart_indicators = ["layer", "concat", "hconcat", "vconcat"]


def apply_fn_to_chart(chart, fn, *args, **kwargs):
    for prop in composite_chart_indicators:
        for idx, child in enumerate(getattr(chart, prop, [])):
            child = apply_fn_to_chart(child, fn, *args, **kwargs)
            arr = getattr(chart, prop)
            arr[idx] = child
            setattr(chart, prop, arr)

    return fn(chart, *args, **kwargs)


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
