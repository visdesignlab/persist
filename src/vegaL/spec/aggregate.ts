import {
  Aggregate,
  isArgmaxDef,
  isArgminDef
} from 'vega-lite/build/src/aggregate';

import {
  Field,
  isConditionalDef,
  isFieldDef,
  isRepeatRef,
  isTimeFieldDef,
  isTypedFieldDef,
  isValueDef
} from 'vega-lite/build/src/channeldef';
import { Encoding } from 'vega-lite/build/src/encoding';
import {
  isPathMark,
  isPrimitiveMark,
  isRectBasedMark
} from 'vega-lite/build/src/mark';
import { isSelectionParameter } from 'vega-lite/build/src/selection';
import {
  AggregateTransform,
  AggregatedFieldDef,
  CalculateTransform,
  JoinAggregateFieldDef,
  JoinAggregateTransform,
  isCalculate
} from 'vega-lite/build/src/transform';
import { Type } from 'vega-lite/build/src/type';
import { ROW_ID } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { Nullable } from '../../utils';
import { pipe } from '../../utils/pipe';
import {
  addEncoding,
  forEachEncoding,
  getFieldsFromEncoding,
  removeEncoding
} from './encoding';
import {
  Filter,
  addFilterTransform,
  createOneOfPredicate,
  invertFilter
} from './filter';
import { ProcessedResult } from './getProcessed';
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

// Types
export type AggregateOperation = Aggregate | 'group';

// Const
const AGGREGATE_COLUMN = '__AGGREGATE__';
const NONE_STRING = '"None"';

// Functions
function getAggregateLayerName(
  aggName: string,
  suffix: 'aggregate' | 'original' = 'aggregate'
): string {
  return getLayerName(aggName, 'AGG', suffix);
}

export function applyAggregate(
  vlProc: VegaLiteSpecProcessor,
  aggregate: Interactions.AggregateAction,
  processedResults: ProcessedResult,
  showOriginal = true
) {
  const { op } = aggregate;

  const { selected } = processedResults;

  const selectionOutPredicate = invertFilter(
    createOneOfPredicate(ROW_ID, selected)
  );

  // remove selections from graph
  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  // add base layer which is everything filtered out
  vlProc.addLayer(BASE_LAYER, spec =>
    addAggregateBaseLayer(spec, selectionOutPredicate)
  );

  // aggregate layer name
  const aggregateLayerName = getAggregateLayerName(aggregate.agg_name);

  switch (op) {
    case 'group':
      // op is not specified, so encode the aggregate as category

      // Add none to aggregates for group only aggregate
      if (op === 'group') {
        vlProc.updateTopLevelTransform(transforms => {
          const calcT: CalculateTransform = {
            calculate: NONE_STRING,
            as: AGGREGATE_COLUMN
          };

          const doesNoneTransformExist = transforms
            .filter(isCalculate)
            .some(t => t.calculate === NONE_STRING);

          if (!doesNoneTransformExist) {
            transforms.push(calcT);
          }

          return transforms;
        });
      }

      vlProc.addLayer(aggregateLayerName, spec =>
        addGroupOnlyAggregateInLayer(
          spec,
          invertFilter(selectionOutPredicate),
          aggregate
        )
      );
      break;
    default:
      // op is specified, so show the aggregate point

      vlProc.addLayer(aggregateLayerName, spec => {
        return addAggregateInLayer(
          spec,
          invertFilter(selectionOutPredicate),
          aggregate
        );
      });

      // show pre-aggregate points
      if (showOriginal) {
        const filteredInLayerName = getAggregateLayerName(
          aggregate.agg_name,
          'original'
        );

        vlProc.addLayer(filteredInLayerName, spec => {
          return addAggregateOriginalLayer(
            spec,
            invertFilter(selectionOutPredicate)
          );
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

  const { mark: m, encoding = {} } = spec;
  const { shape, color } = encoding;

  const mark = getMark(m);

  const isPointLike =
    isPrimitiveMark(mark) && !isRectBasedMark(mark) && !isPathMark(mark);

  const hasColorEncoded =
    !!color && (!isValueDef(color) || isConditionalDef(color));
  const hasShapeEncoded =
    !!shape && (!isValueDef(shape) || isConditionalDef(shape));

  if (!shape && !isPointLike) {
    //
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
  filter: Filter | Filter[],
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

  const { mark: m, encoding = {} } = spec;
  const { shape, color } = encoding;

  const mark = getMark(m);

  const isPointLike =
    isPrimitiveMark(mark) && !isRectBasedMark(mark) && !isPathMark(mark);
  const hasColorEncoded =
    !!color && (!isValueDef(color) || isConditionalDef(color));
  const hasShapeEncoded =
    !!shape && (!isValueDef(shape) || isConditionalDef(shape));

  if (!isPointLike) {
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
  filter: Filter | Filter[],
  aggregate: Interactions.AggregateAction
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  const mark = getMark(spec.mark);

  if (isPathMark(mark)) {
    // do nothing for now
  } else if (isRectBasedMark(mark)) {
    // this is barchart like
  } else if (isPrimitiveMark(mark)) {
    spec.encoding = removeEncoding(spec.encoding, 'fillOpacity');
    spec.encoding = removeEncoding(spec.encoding, 'strokeOpacity');

    // this is point-like mark for scatterplots
    if (!isRectBasedMark(mark)) {
      spec.encoding = addEncoding(spec.encoding, 'size', {
        value: 400 // derive from spec later
      });
    }
  }

  const { aggs, joinAggs, calcTransform } = getAllAggFieldDefs(spec, aggregate);

  // generate aggregate transforms
  const aggTransform: AggregateTransform = {
    aggregate: aggs
  };

  const joinAggTransform: JoinAggregateTransform = {
    joinaggregate: joinAggs
  };

  if (aggs.length > 0) {
    transform.push(aggTransform);
  }
  if (joinAggs.length > 0) {
    transform.push(joinAggTransform);
  }

  // generate calc transforms
  const calcT: CalculateTransform[] = [
    ...calcTransform,
    {
      calculate: `"${aggregate.agg_name}"`,
      as: AGGREGATE_COLUMN
    }
  ];

  const possibleEncodings = spec.encoding || {};
  const fieldDefs = getFieldsFromEncoding(possibleEncodings);

  fieldDefs.forEach(fd => {
    const { field } = fd;
    let type: Nullable<Type> = null;

    if (isTypedFieldDef(fd)) {
      type = fd.type;
    }

    if (field && !isRepeatRef(field)) {
      switch (type) {
        case 'nominal':
          calcT.push({
            calculate: `"${aggregate.agg_name}"`,
            as: field
          });
          break;
      }
    }
  });

  transform.push(...calcT);

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
 * @returns
 *
 * shows the points with low opacity
 *
 */
export function addAggregateOriginalLayer(
  spec: AnyUnitSpec,
  filter: Filter[] | Filter
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  // Fade out the original points
  spec.encoding = addEncoding(spec.encoding, 'opacity', {
    value: 0.2
  });

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

function getAllAggFieldDefs(
  spec: AnyUnitSpec,
  agg: Interactions.AggregateAction
) {
  const { op } = agg;
  const aggs: AggregatedFieldDef[] = [];
  const joinAggs: JoinAggregateFieldDef[] = [];
  const calcTransform: CalculateTransform[] = [];

  forEachEncoding(spec.encoding as Encoding<Field>, (channel, channelDef) => {
    if (!isFieldDef(channelDef)) {
      return channelDef;
    }

    // Process fields with types
    if (isTypedFieldDef(channelDef)) {
      switch (channelDef.type) {
        case 'quantitative': //  Quantitative fields
          if (isRepeatRef(channelDef.field)) {
            // handle repeat
          } else if (
            channelDef['aggregate'] &&
            channelDef['aggregate'] !== 'count'
          ) {
            // Handle aggregate if not count
          } else if (channelDef['aggregate'] === 'count') {
            // do nothing
          } else {
            joinAggs.push({
              // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
              field: channelDef.field!,
              // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
              as: channelDef.field!,
              op: getOperationName(op)
            });
          }
          break;
        case 'nominal':
          if (isRepeatRef(channelDef.field)) {
            // handle repeat
          } else if (
            channelDef['aggregate'] &&
            channelDef['aggregate'] !== 'count'
          ) {
            // Handle aggregate if not count
          } else {
            calcTransform.push({
              calculate: `"${agg.agg_name}"`,
              // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
              as: channelDef.field!
            });
          }
          break;
        case 'temporal':
          // shouldn't enter anywhere else for isTimeField  check;
          if (isRepeatRef(channelDef.field)) {
            // handle repeat
          } else if (isTimeFieldDef(channelDef)) {
            // Skip
          }
          break;
        case 'ordinal':
        case 'geojson':
        default:
          console.info('Skipping', channel, channelDef);
          break;
      }
    } else {
      console.info("Don't know how to handle: ", channel, channelDef);
    }
  });
  // handle composite mark

  return { aggs, joinAggs, calcTransform };
}

export function estimateAggregateOp(_x: any): Aggregate {
  return 'mean';
}
