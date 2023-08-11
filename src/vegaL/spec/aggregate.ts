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
import { SelectionInteractionGroups } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { Nullable } from '../../utils';
import { pipe } from '../../utils/pipe';
import { addEncoding, getFieldsFromEncoding, removeEncoding } from './encoding';
import {
  Filter,
  addFilterTransform,
  getCombinationFiltersFromSelectionGroups
} from './filter';
import { getMark } from './marks';
import { VegaLiteSpecProcessor } from './processor';
import { removeParameterValue } from './selection';
import { BASE_LAYER, getLayerName } from './spec';
import {
  AnyUnitSpec,
  removeUnitSpecName,
  removeUnitSpecSelectionFilters,
  removeUnitSpecSelectionParams
} from './view';

const AGGREGATE_COLUMN = '__AGGREGATE__';

function getAggregateLayerName(
  aggName: string,
  suffix: 'aggregate' | 'original' = 'aggregate'
): string {
  return getLayerName(aggName, 'AGG', suffix);
}

export function applyAggregate(
  vlProc: VegaLiteSpecProcessor,
  aggregate: Interactions.AggregateAction,
  selectionGroups: SelectionInteractionGroups,
  showOriginal = true
) {
  const { op } = aggregate;

  const {
    currentSelectionFilterOutPredicate,
    currentSelectionFilterInPredicate,
    compositeFilterPredicate
  } = getCombinationFiltersFromSelectionGroups(selectionGroups);

  // get all selections

  // create filters from seelctions
  // const filterOutPredicates = createLogicalOrPredicate(getFiltersFromSelections(selections));

  // remove selections from graph
  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  // add base layer which is everything filtered out
  vlProc.addLayer(BASE_LAYER, spec =>
    addAggregateBaseLayer(spec, currentSelectionFilterInPredicate)
  );

  // aggregate layer name
  const aggregateLayerName = getAggregateLayerName(aggregate.agg_name);

  switch (op) {
    case 'group':
      // op is not specified, so encode the aggregate as category
      vlProc.addLayer(aggregateLayerName, spec =>
        addGroupOnlyAggregateInLayer(spec, compositeFilterPredicate, aggregate)
      );
      break;
    default:
      // op is specified, so show the aggregate point

      vlProc.addLayer(aggregateLayerName, spec => {
        return addAggregateInLayer(spec, compositeFilterPredicate, aggregate); //
      });

      // show pre-aggregate points
      if (showOriginal) {
        const filteredInLayerName = getAggregateLayerName(
          aggregate.agg_name,
          'original'
        );

        vlProc.addLayer(filteredInLayerName, spec => {
          return addAggregateFilterInLayer(spec, compositeFilterPredicate);
        });
      }

      break;
  }

  return vlProc;
}

// TODO: Here is the place to fix the bug with agg column appearing earlier than needed
// TODO: None transform may appear multiple times
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

export function addGroupOnlyAggregateInLayer(
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

  spec.transform = [...transform, calcT];

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
  const { op } = aggregate;

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
    if (!isRectBasedMark(mark)) {
      spec.encoding = addEncoding(spec.encoding, 'size', {
        value: 400 // derive from spec later
      });
    }
  }

  // generate aggregate transforms
  const aggTransform: JoinAggregateTransform = {
    joinaggregate: getJoinAggFieldDefs(spec, getOperationName(op))
  };

  spec.transform = [...transform, aggTransform];

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
 * @returns
 *
 * shows the points with low opacity
 *
 */
export function addAggregateFilterInLayer(
  spec: AnyUnitSpec,
  filter: Filter
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const mark = getMark(spec.mark);

  // Fade out the original points
  spec.encoding = addEncoding(spec.encoding, 'opacity', {
    value: 0.2
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
