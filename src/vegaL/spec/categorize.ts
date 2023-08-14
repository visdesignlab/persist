import { Aggregate } from 'vega-lite/build/src/aggregate';

import {
  isConditionalDef,
  isFieldDef,
  isValueDef
} from 'vega-lite/build/src/channeldef';
import { AnyMark, isMarkDef, isPrimitiveMark } from 'vega-lite/build/src/mark';
import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { CalculateTransform } from 'vega-lite/build/src/transform';
import { SelectionInteractionGroups } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { pipe } from '../../utils/pipe';
import { addEncoding } from './encoding';
import {
  Filter,
  addFilterTransform,
  getCombinationFiltersFromSelectionGroups
} from './filter';
import { VegaLiteSpecProcessor } from './processor';
import { removeParameterValue } from './selection';
import { BASE_LAYER } from './spec';
import {
  AnyUnitSpec,
  removeUnitSpecName,
  removeUnitSpecSelectionFilters,
  removeUnitSpecSelectionParams
} from './view';

export function applyCategory(
  vlProc: VegaLiteSpecProcessor,
  categoryAction: Interactions.CategoryAction,
  selectionGroups: SelectionInteractionGroups
) {
  const { categoryName, selectedOption } = categoryAction;

  const {
    currentSelectionFilterInPredicate,
    currentSelectionFilterOutPredicate,
    previousSelectionFilterOutPredicate
  } = getCombinationFiltersFromSelectionGroups(selectionGroups);

  const comboFilters = [
    ...previousSelectionFilterOutPredicate,
    currentSelectionFilterInPredicate
  ];

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  vlProc.addLayer(BASE_LAYER, spec =>
    addCategoryBaseLayer(spec, currentSelectionFilterOutPredicate, categoryName)
  );

  vlProc.addLayer(categoryName + selectedOption, spec => {
    return addCategoryLayer(spec, comboFilters, categoryName, selectedOption);
  });

  return vlProc;
}

export function addCategoryBaseLayer(
  spec: AnyUnitSpec,
  filter: Filter,
  categoryName: string
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  const calcT: CalculateTransform = {
    calculate: '"None"',
    as: categoryName
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
      field: categoryName,
      type: 'nominal'
    });
  } else if (hasShapeEncoded && !hasColorEncoded) {
    // if has shape encoded, use color
    spec.encoding = addEncoding(spec.encoding, 'color', {
      field: categoryName,
      type: 'nominal'
    });
  } else if (hasColorEncoded && !hasShapeEncoded) {
    // if has color encoded use shape
    spec.encoding = addEncoding(spec.encoding, 'shape', {
      field: categoryName,
      type: 'nominal'
    });
  } else {
    // if both are encoded
    const { mark, encoding = {} } = spec;
    const { shape, color } = encoding;

    if (
      // check if the encoding is aggregation, else warn
      !(
        (isFieldDef(shape) && shape.field === categoryName) ||
        (isFieldDef(color) && color.field === categoryName)
      )
    ) {
      console.warn(
        `Could not find a channel to encode: ${categoryName}`,
        color,
        shape,
        mark
      );
    }
  }

  return spec;
}

// NOTE: should this logical and?
/**
 * This function adds back the filtered data and makes it transparent. This should be optional at some point
 * @param spec -
 * @param filter -
 * @returns
 */
export function addCategoryLayer(
  spec: AnyUnitSpec,
  filter: Filter[],
  categoryName: string,
  option: string
): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  const calcTransform: CalculateTransform = {
    calculate: `"_${option}"`,
    as: categoryName
  };

  transform.push(calcTransform);
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
      field: categoryName,
      type: 'nominal'
    });
  } else if (hasShapeEncoded && !hasColorEncoded) {
    spec.encoding = addEncoding(spec.encoding, 'color', {
      field: categoryName,
      type: 'nominal'
    });
  } else if (hasColorEncoded && !hasShapeEncoded) {
    spec.encoding = addEncoding(spec.encoding, 'shape', {
      field: categoryName,
      type: 'nominal'
    });
  } else {
    console.warn(`Could not find a channel to encode: ${categoryName}`);
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

export function estimateAggregateOp(_x: any): Aggregate {
  return 'mean';
}
