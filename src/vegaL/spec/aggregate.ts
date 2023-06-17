import { Aggregate } from 'vega-lite/build/src/aggregate';
import {
  AnyMark,
  isMarkDef,
  isPathMark,
  isPrimitiveMark,
  isRectBasedMark
} from 'vega-lite/build/src/mark';
import { isSelectionParameter } from 'vega-lite/build/src/selection';
import {
  CalculateTransform,
  JoinAggregateTransform
} from 'vega-lite/build/src/transform';
import { Interactions } from '../../interactions/types';
import { pipe } from '../../utils/pipe';
import { addEncoding, removeEncoding } from './encoding';
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

export function AGG_NAME(aggName: string, suffix = '') {
  if (suffix.length === 0) return aggName;

  return `${aggName}_${suffix}`;
}

export function applyAggregate(
  vlProc: VegaLiteSpecProcessor,
  aggregate: Interactions.AggregateAction
) {
  const { params = [] } = vlProc;

  const selections = params.filter(isSelectionParameter);

  const filterOutPredicates = getFiltersFromSelections(selections, 'out');

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  const baseLayerName = OUT_FILTER_LAYER;
  vlProc.addLayer(baseLayerName, spec =>
    addFilterTransform(spec, createLogicalOrPredicate(filterOutPredicates))
  );

  const inFilter = invertFilter(createLogicalOrPredicate(filterOutPredicates));

  // this can be skipped if we don't want to show pre-aggregate data
  const filteredInLayerName = AGG_NAME(aggregate.agg_name, IN_FILTER_LAYER);
  vlProc.addLayer(filteredInLayerName, spec => {
    return addAggregateFilterInLayer(spec, inFilter);
  });

  // add agg
  const aggregateLayerName = AGG_NAME(aggregate.agg_name, 'AGG');
  vlProc.addLayer(aggregateLayerName, spec => {
    return addAggregateInLayer(spec, inFilter);
  });

  return vlProc;
}

export function addAggregateInLayer(
  spec: AnyUnitSpec,
  filter: Filter
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  spec.encoding = removeEncoding(spec.encoding, 'opacity');

  const mark = getMark(spec.mark);

  if (isPathMark(mark)) {
    // do nothing for now
  } else if (isRectBasedMark(mark)) {
    // this is barchart like
    spec.encoding = removeEncoding(spec.encoding, 'opacity');
  } else if (isPrimitiveMark(mark)) {
    // this is point like mark for scatterplots
    spec.encoding = addEncoding(spec.encoding, 'size', {
      value: 400 // derive from spec later
    });
    spec.encoding = removeEncoding(spec.encoding, 'fillOpacity');
    spec.encoding = removeEncoding(spec.encoding, 'strokeOpacity');
  } else {
    // this is composite mark. determine later
  }

  const aggTransform: JoinAggregateTransform = {};

  const calculateTransforms: CalculateTransform[] = [];

  transform.push(aggTransform);
  transform.push(...calculateTransforms);

  spec.transform = transform;

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}

// NOTE: should this logical and?
export function addAggregateFilterInLayer(
  spec: AnyUnitSpec,
  filter: Filter
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const mark = getMark(spec.mark);

  // currently add for all marks
  spec.encoding = addEncoding(spec.encoding, 'fillOpacity', {
    value: 0.2
  });
  spec.encoding = addEncoding(spec.encoding, 'strokeOpacity', {
    value: 0.8
  });
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

function getMark(mark: AnyMark) {
  if (isPrimitiveMark(mark)) {
    return mark;
  }

  if (isMarkDef(mark)) {
    return mark.type;
  }

  return mark;
}

export function estimateAggregateOp(_x: any): Aggregate {
  return 'mean';
}
