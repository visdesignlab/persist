import { Aggregate } from 'vega-lite/build/src/aggregate';

import { isRepeatRef, isTypedFieldDef } from 'vega-lite/build/src/channeldef';
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

  const filterOutPredicates = getFiltersFromSelections(selections);
  const outFilter = invertFilter(createLogicalOrPredicate(filterOutPredicates));

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  const baseLayerName = OUT_FILTER_LAYER;
  vlProc.addLayer(baseLayerName, spec => addFilterTransform(spec, outFilter));

  const inFilter = invertFilter(outFilter);

  // this can be skipped if we don't want to show pre-aggregate data
  const filteredInLayerName = AGG_NAME(aggregate.agg_name, IN_FILTER_LAYER);
  vlProc.addLayer(filteredInLayerName, spec => {
    return addAggregateFilterInLayer(spec, inFilter);
  });

  // add agg
  const aggregateLayerName = AGG_NAME(aggregate.agg_name, 'AGG');
  vlProc.addLayer(aggregateLayerName, spec => {
    return addAggregateInLayer(spec, inFilter, aggregate);
  });

  return vlProc;
}

export function addAggregateInLayer(
  spec: AnyUnitSpec,
  filter: Filter,
  aggregate: Interactions.AggregateAction
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  spec.encoding = removeEncoding(spec.encoding, 'opacity');

  const mark = getMark(spec.mark);

  if (isPathMark(mark)) {
    // do nothing for now
  }

  if (isRectBasedMark(mark)) {
    // this is barchart like
    spec.encoding = removeEncoding(spec.encoding, 'opacity');
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

  const aggTransform: JoinAggregateTransform = {
    joinaggregate: getJoinAggFieldDefs(spec)
  };

  const calculateTransforms: CalculateTransform[] = getCalculateTransforms(
    spec,
    `"${aggregate.agg_name}"`
  );

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
/**
 * This function adds back the filtered data and makes it transparent. This should be optional at some point
 * @param spec -
 * @param filter -
 * @returns
 */
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
  if (isMarkDef(mark)) {
    return mark.type;
  }

  if (isPrimitiveMark(mark)) {
    return mark;
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

      if (isTypedFieldDef(fd)) type = fd.type;

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

function getJoinAggFieldDefs(spec: AnyUnitSpec) {
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

      if (isTypedFieldDef(fd)) type = fd.type;

      // if is a non-repeat field
      if (field && !isRepeatRef(field) && !aggregate) {
        switch (type) {
          case 'quantitative':
            aggs.push({
              field: field,
              as: field,
              op: 'mean'
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
