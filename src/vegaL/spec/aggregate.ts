import {
  Aggregate,
  isArgmaxDef,
  isArgminDef
} from 'vega-lite/build/src/aggregate';

import {
  isConditionalDef,
  isFieldDef,
  isRepeatRef,
  isTypedFieldDef,
  isValueDef
} from 'vega-lite/build/src/channeldef';
import {
  AnyMark,
  isMarkDef,
  isPathMark,
  isPrimitiveMark,
  isRectBasedMark
} from 'vega-lite/build/src/mark';
import { isSelectionParameter } from 'vega-lite/build/src/selection';
import {
  AggregatedFieldDef,
  CalculateTransform,
  JoinAggregateFieldDef,
  JoinAggregateTransform
} from 'vega-lite/build/src/transform';
import { Type } from 'vega-lite/build/src/type';
import { Interactions } from '../../interactions/types';
import { Nullable } from '../../utils';
import { pipe } from '../../utils/pipe';
import { addEncoding, getFieldsFromEncoding, removeEncoding } from './encoding';
import {
  Filter,
  IN_FILTER_LAYER,
  OUT_FILTER_LAYER,
  addFilterTransform,
  createLogicalOrPredicate,
  getFiltersFromSelections,
  invertFilter
} from './filter';
import { VegaLiteSpecProcessor } from './processor';
import { removeParameterValue } from './selection';
import {
  AnyUnitSpec,
  removeUnitSpecName,
  removeUnitSpecSelectionFilters,
  removeUnitSpecSelectionParams
} from './view';

const AGGREGATE_COLUMN = '__AGGREGATE__';

export function AGG_NAME(aggName: string, suffix = '') {
  if (suffix.length === 0) {
    return aggName;
  }

  return `${aggName}_${suffix}`;
}

export function applyAggregate(
  vlProc: VegaLiteSpecProcessor,
  aggregate: Interactions.AggregateAction,
  showOriginal = true
) {
  const { op } = aggregate;
  const isOnlyGroup = op === 'group';

  const { params = [] } = vlProc;

  const selections = params.filter(isSelectionParameter);

  const filterOutPredicates = getFiltersFromSelections(selections);
  const outFilter = invertFilter(createLogicalOrPredicate(filterOutPredicates)); // to filter out pre-aggregate points

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  const baseLayerName = OUT_FILTER_LAYER;
  vlProc.addLayer(baseLayerName, spec =>
    addAggregateBaseLayer(spec, outFilter)
  );

  const inFilter = invertFilter(outFilter); // to filter in pre-aggregate points

  if (isOnlyGroup) {
    // op is not specified, so encode the aggregate as category
    const filteredInLayerName = AGG_NAME(aggregate.agg_name, IN_FILTER_LAYER);
    vlProc.addLayer(filteredInLayerName, spec =>
      addGroupOnlyAggregateLayer(spec, inFilter, aggregate)
    );
  } else {
    // op is specified, so show the aggregate point

    // show pre-aggregate points
    if (showOriginal) {
      const filteredInLayerName = IN_FILTER_LAYER;
      vlProc.addLayer(filteredInLayerName, spec => {
        return addAggregateFilterInLayer(spec, inFilter);
      });
    }
    const aggregateLayerName = AGG_NAME(aggregate.agg_name, 'AGG');
    vlProc.addLayer(aggregateLayerName, spec => {
      return addAggregateInLayer(spec, inFilter, aggregate);
    });
  }

  return vlProc;
}

// TODO: Here is the place to fix the bug with agg column appearing earlier than needed
export function addAggregateBaseLayer(
  spec: AnyUnitSpec,
  filter: Filter
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  const calcT: CalculateTransform = {
    calculate: '"None"',
    as: AGGREGATE_COLUMN
  };

  transform.push(calcT);
  spec.transform = transform;

  const { mark, encoding = {} } = spec;
  const { shape, color } = encoding;

  const isPointMark = getMark(mark);
  const hasColorEncoded =
    !!color && (!isValueDef(color) || isConditionalDef(color));
  const hasShapeEncoded =
    !!shape && (!isValueDef(shape) || isConditionalDef(shape));

  if (!isPointMark) {
    // if mark is not point, should change to point
    spec.mark = 'point';
    spec.encoding = addEncoding(spec.encoding, 'shape', {
      field: AGGREGATE_COLUMN,
      type: 'nominal'
    });
  } else if (hasShapeEncoded && !hasColorEncoded) {
    // if has shape encoded, use color
    spec.encoding = addEncoding(spec.encoding, 'color', {
      field: AGGREGATE_COLUMN,
      type: 'nominal'
    });
  } else if (hasColorEncoded && !hasShapeEncoded) {
    // if has color encoded use shape
    spec.encoding = addEncoding(spec.encoding, 'shape', {
      field: AGGREGATE_COLUMN,
      type: 'nominal'
    });
  } else {
    // if both are encoded
    const { mark, encoding = {} } = spec;
    const { shape, color } = encoding;

    if (
      // check if the encoding is aggregation, else warn
      !(
        (isFieldDef(shape) && shape.field === AGGREGATE_COLUMN) ||
        (isFieldDef(color) && color.field === AGGREGATE_COLUMN)
      )
    ) {
      console.warn(
        `Could not find a channel to encode: ${AGGREGATE_COLUMN}`,
        color,
        shape,
        mark
      );
    }
  }

  return spec;
}

export function addGroupOnlyAggregateLayer(
  spec: AnyUnitSpec,
  filter: Filter,
  aggregate: Interactions.AggregateAction
): AnyUnitSpec {
  if (aggregate.op !== 'group') {
    throw new Error('cannot add non-group layer here');
  }

  const { agg_name } = aggregate;

  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  const calcT: CalculateTransform = {
    calculate: `"${agg_name}"`,
    as: AGGREGATE_COLUMN
  };

  transform.push(calcT);
  spec.transform = transform;

  const { mark, encoding = {} } = spec;
  const { shape, color } = encoding;

  const isPointMark = getMark(mark);
  const hasColorEncoded =
    !!color && (!isValueDef(color) || isConditionalDef(color));
  const hasShapeEncoded =
    !!shape && (!isValueDef(shape) || isConditionalDef(shape));

  if (!isPointMark) {
    spec.mark = 'point';
    spec.encoding = addEncoding(spec.encoding, 'shape', {
      field: AGGREGATE_COLUMN,
      type: 'nominal'
    });
  } else if (hasShapeEncoded && !hasColorEncoded) {
    spec.encoding = addEncoding(spec.encoding, 'color', {
      field: AGGREGATE_COLUMN,
      type: 'nominal'
    });
  } else if (hasColorEncoded && !hasShapeEncoded) {
    spec.encoding = addEncoding(spec.encoding, 'shape', {
      field: AGGREGATE_COLUMN,
      type: 'nominal'
    });
  } else {
    console.warn(`Could not find a channel to encode: ${AGGREGATE_COLUMN}`);
  }

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}

/**
 * adds the layer for showing aggregate data point
 * @param spec -
 * @param filter - infilter
 * @param aggregate -
 * @returns
 */
export function addAggregateInLayer(
  spec: AnyUnitSpec,
  filter: Filter,
  aggregate: Interactions.AggregateAction
): AnyUnitSpec {
  const { op, agg_name } = aggregate;

  const isOnlyGroup = op === 'group';

  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  const mark = getMark(spec.mark);

  if (isPathMark(mark)) {
    // do nothing for now
  }

  if (isRectBasedMark(mark)) {
    // this is barchart like
  }

  if (isPrimitiveMark(mark)) {
    spec.encoding = removeEncoding(spec.encoding, 'fillOpacity');
    spec.encoding = removeEncoding(spec.encoding, 'strokeOpacity');

    // this is point-like mark for scatterplots
    if (!isRectBasedMark(mark) && !isOnlyGroup) {
      spec.encoding = addEncoding(spec.encoding, 'size', {
        value: 400 // derive from spec later
      });
    }
  }

  if (op !== 'group') {
    const aggTransform: JoinAggregateTransform = {
      joinaggregate: getJoinAggFieldDefs(spec, getOperationName(op))
    };
    transform.push(aggTransform);
  }

  const calculateTransforms: CalculateTransform[] = getCalculateTransforms(
    spec,
    `"${agg_name}"`
  );

  transform.push(...calculateTransforms);

  spec.transform = transform;

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}

// NOTE: should this logical and?
/**
 * This function adds back the filtered data and makes it transparent. This should be optional at some point
 * @param spec -
 * @param filter -
 * @param isOnlyGroup -
 * @returns
 */
export function addAggregateFilterInLayer(
  spec: AnyUnitSpec,
  filter: Filter
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const mark = getMark(spec.mark);

  // currently add for all marks  if not showing only groups
  spec.encoding = addEncoding(spec.encoding, 'fillOpacity', {
    value: 0.2
  });
  spec.encoding = addEncoding(spec.encoding, 'strokeOpacity', {
    value: 0.8
  });

  if (isPathMark(mark)) {
    // do nothing for now
  } else if (isRectBasedMark(mark)) {
    // this is barchart like
  } else if (isPrimitiveMark(mark)) {
    // this is point like mark for scatterplots
  } else {
    // this is composite mark. determine later
  }

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}

function getMark(mark: AnyMark) {
  if (isMarkDef(mark)) {
    return mark.type;
  }

  return mark;
}

function getCalculateTransforms(spec: AnyUnitSpec, calculate: string) {
  const cts: CalculateTransform[] = [];

  const mark = getMark(spec.mark);

  if (isPathMark(mark)) {
    // do nothing for now
  }
  if (isRectBasedMark(mark)) {
    // this is barchart like
  }
  if (isPrimitiveMark(mark)) {
    // this is point like mark for scatterplots
    const possibleEncodings = spec.encoding || {};
    const fieldDefs = getFieldsFromEncoding(possibleEncodings);

    fieldDefs.forEach(fd => {
      const { field } = fd;
      let type: Nullable<Type> = null;

      if (isTypedFieldDef(fd)) {
        type = fd.type;
      }

      // if is a non-repeat field
      if (field && !isRepeatRef(field)) {
        switch (type) {
          case 'nominal':
            cts.push({
              calculate,
              as: field
            });
            break;
        }
      }
    });
  }

  // handle composite mark

  return cts;
}

// HANDLE GROUP
function getOperationName(op: AggregateOperation): AggregatedFieldDef['op'] {
  if (op === 'group') {
    return 'mean';
  }

  if (isArgminDef(op)) {
    return 'argmin';
  }

  if (isArgmaxDef(op)) {
    return 'argmax';
  }

  return op;
}

function getJoinAggFieldDefs(
  spec: AnyUnitSpec,
  op: JoinAggregateFieldDef['op']
) {
  const aggs: JoinAggregateFieldDef[] = [];

  const mark = getMark(spec.mark);

  if (isPathMark(mark)) {
    // do nothing for now
  }
  if (isRectBasedMark(mark)) {
    // this is barchart like
  }
  if (isPrimitiveMark(mark)) {
    // this is point like mark for scatterplots
    const possibleEncodings = spec.encoding || {};
    const fieldDefs = getFieldsFromEncoding(possibleEncodings);

    fieldDefs.forEach(fd => {
      const { field, aggregate } = fd;
      let type: Nullable<Type> = null;

      if (isTypedFieldDef(fd)) {
        type = fd.type;
      }

      // if is a non-repeat field
      // add warning when op is 'sum' and field itself is not aggregate encoding?
      if (field && !isRepeatRef(field) && !aggregate) {
        switch (type) {
          case 'quantitative':
            aggs.push({
              field: field,
              as: field,
              op
            });
            break;
        }
      }
    });
  }

  // handle composite mark

  return aggs;
}

export function estimateAggregateOp(_x: any): Aggregate {
  return 'mean';
}

export type AggregateOperation = Aggregate | 'group';
