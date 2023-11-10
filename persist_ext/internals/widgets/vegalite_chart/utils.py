import re
from altair import (
    Chart,
    Color,
    ConcatChart,
    FacetChart,
    HConcatChart,
    LayerChart,
    RepeatChart,
    Tooltip,
    TopLevelSpec,
    Undefined,
    VConcatChart,
    condition,
    value,
)
from altair.utils.core import parse_shorthand

from persist_ext.internals.data.idfy import ID_COLUMN

spec_type_chart = [RepeatChart, FacetChart]

subchart_prop_map = {
    Chart: None,
    ConcatChart: "concat",
    HConcatChart: "hconcat",
    VConcatChart: "vconcat",
    LayerChart: "layer",
    RepeatChart: "spec",
    FacetChart: "spec",
}


def is_vega_altair_chart(chart):
    return type(chart) in subchart_prop_map


def process_recursive_subcharts(chart: TopLevelSpec, fn_to_apply, *args, **kwargs):
    _type = type(chart)

    if _type not in subchart_prop_map:
        raise Exception(f"Unexpected chart type: {_type}")

    subchart_prop = subchart_prop_map[_type]

    chart = fn_to_apply(chart, *args, **kwargs)

    if subchart_prop is not None:
        subchart_value = getattr(chart, subchart_prop, None)

        if subchart_value is None:
            raise Exception(f"Instance of {_type} is missing property {subchart_prop}")

        if _type in spec_type_chart:
            subchart_value = process_recursive_subcharts(
                subchart_value, fn_to_apply, *args, **kwargs
            )

        elif isinstance(subchart_value, list):
            for idx, subchart in enumerate(subchart_value):
                subchart_value[idx] = process_recursive_subcharts(
                    subchart, fn_to_apply, *args, **kwargs
                )

        setattr(chart, subchart_prop, subchart_value)

    if chart is None:
        return "Argument 'fn_to_apply' should be a function and should return the modified chart. It seems to return 'None' instead."
    return chart


""" Encoding Values
    - Field Encoding
      {
        "field": field name (optional if agg is count),
        "type": "quantitative", "nominal", "ordinal", "temporal", "geojson"
        "aggregate": any agg operation; 
        "bin": When column is quantitative and other operation is aggregate
      }
    - Datum Encoding
      {
        datum: valid value from dataset
      }
    - Value Encoding
      {
        value: any value
      }
"""


def add_color_to_matching_views(chart, view_name, enc_str):
    add_encoding = False

    if hasattr(chart, "name") and chart.name in view_name:
        add_encoding = True
    elif len(view_name) == 0:
        add_encoding = True

    if add_encoding:
        if enc_str is Undefined:
            chart.encoding.color = enc_str
        else:
            chart = chart.encode(color=enc_str)

    return chart


def add_color_to_matching_views_recursive(chart, view_name, enc_str):
    return process_recursive_subcharts(
        chart, add_color_to_matching_views, view_name, enc_str
    )


def add_new_nominal_encoding(chart, field_name, options):
    encoding_string = f"{field_name}:N"
    encoding = getattr(chart, "encoding", Undefined)

    if encoding is Undefined:
        return chart

    chart = add_tooltip_encoding(chart, encoding_string)

    color_encoding = getattr(encoding, "color", Undefined)

    if color_encoding is Undefined:
        return chart.encode(
            color=Color(encoding_string).sort(options).legend(values=options)
        )

    return chart


def add_new_nominal_encoding_recursive(chart, field_name, options):
    return process_recursive_subcharts(
        chart, add_new_nominal_encoding, field_name, options
    )


def check_encodings_for_utc(chart):
    encoding = getattr(chart, "encoding", Undefined)

    if encoding is not Undefined:
        for channel, enc in encoding._kwds.items():
            if enc is Undefined:
                continue
            enc = enc.to_dict()

            if "timeUnit" in enc and not (enc["timeUnit"].startswith("utc")):
                raise Exception(
                    f"Encoding for '{channel}' possibly using `timeUnit` without `utc` specification. Please use `utc` time formats for compatibility with interactions. E.g use `utcyear` or `utcmonth` instead of `year` or `month`.\n Provided encoding: {enc}"
                )

    return chart


def check_encodings_for_utc_recursive(chart):
    return process_recursive_subcharts(chart, check_encodings_for_utc)


def add_tooltip_encoding(chart, field_encoding):
    """
    Set tooltip encoding of chart to supplied field_encoding
    """
    if hasattr(chart, "encoding"):
        encoding = getattr(chart.encoding, "tooltip", Undefined)

        if encoding is Undefined:
            return chart.encode(tooltip=[field_encoding])

        if isinstance(encoding, list):
            encoding.append(field_encoding)
            return chart.encode(tooltip=encoding)

        if is_shorthand(encoding):
            encoding = [encoding, Tooltip(field_encoding)]

    return chart


def add_tooltip_encoding_recursive(chart, field):
    chart = process_recursive_subcharts(chart, add_tooltip_encoding, field)
    return chart


def get_encodings(chart, fn):
    chart = chart.copy(deep=True)
    if hasattr(chart, "encoding"):
        for k, v in chart.encoding._kwds.items():
            if v is not Undefined and k != "tooltip":
                vv = v.to_dict()
                if "field" in vv:
                    fn(vv["field"])

    return chart


def get_encodings_recursive(chart, fn):
    return process_recursive_subcharts(chart, get_encodings, fn)


TEST_SELECTION_PREFIX = "__test_selection__"
PRED_HOVER_SIGNAL = TEST_SELECTION_PREFIX + "__pred_hover__"


def get_hover_prediction_signal(originalPredicate):
    return {
        "or": [
            f"if({PRED_HOVER_SIGNAL}.length > 0, indexof({PRED_HOVER_SIGNAL}, datum.{ID_COLUMN}) > -1,false)",
            {
                "and": [
                    f"if({PRED_HOVER_SIGNAL}.length > 0, false, true)",
                    originalPredicate,
                ]
            },
        ]
    }


def add_prediction_hover_test(chart, channel, if_true, if_false):
    if hasattr(chart, "encoding"):
        encoding = chart.encoding

        if if_true is None and if_false is None:
            chart = chart.encode(
                opacity=condition("if(1===1, true, true)", value(0.7), value(0.7))
            )

            return chart

        getattr(encoding, channel, Undefined)

        chart = chart.encode(
            opacity=condition(
                f"if({PRED_HOVER_SIGNAL}.length > 0, indexof({PRED_HOVER_SIGNAL}, datum.{ID_COLUMN}) > -1, if ({PRED_HOVER_SIGNAL}.length > 0, false, true))",
                value(if_true),
                value(if_false),
            )
        )

    return chart


def add_prediction_hover_test_recursive(chart, channel, if_true, if_false):
    return process_recursive_subcharts(
        chart, add_prediction_hover_test, channel, if_true, if_false
    )


def pop_data_defs_from_charts(chart, datasets):
    data = getattr(chart, "data", Undefined)
    if data is not Undefined:
        datasets.append(data)

    chart.data = Undefined

    if hasattr(chart, "datasets"):
        chart.datasets = Undefined

    return chart


def pop_data_defs_from_charts_recursive(chart, datasets):
    return process_recursive_subcharts(chart, pop_data_defs_from_charts, datasets)


def is_shorthand(encoding):
    return hasattr(encoding, "shorthand")


def get_parsed_encoding(encoding):
    if is_shorthand(encoding):
        return parse_shorthand(encoding.shorthand)
    return encoding


def is_field_encoding(encoding):
    return hasattr(encoding, "field")


def is_aggregate_encoding(encoding):
    return hasattr(encoding, "aggregate")


def is_quantitative(encoding):
    return getattr(encoding, "type", None) == "quantitative"


def is_nominal(encoding):
    return getattr(encoding, "type", None) == "nominal"


def is_ordinal(encoding):
    return getattr(encoding, "type", None) == "ordinal"


def is_temporal(encoding):
    return getattr(encoding, "type", None) == "temporal"


def is_binned(encoding):
    return hasattr(encoding, "bin")


def is_datum_encoding(encoding):
    return hasattr(encoding, "datum")


def is_conditional_encoding(encoding):
    return hasattr(encoding, "condition")


def is_value_encoding(encoding):
    return hasattr(encoding, "value")


def is_value_only_encoding(encoding):
    return not is_conditional_encoding(encoding) and is_value_encoding(encoding)


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
