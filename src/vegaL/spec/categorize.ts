import { Aggregate } from 'vega-lite/build/src/aggregate';

import {
  isConditionalDef,
  isFieldDef,
  isValueDef
} from 'vega-lite/build/src/channeldef';
import { AnyMark, isMarkDef, isPrimitiveMark } from 'vega-lite/build/src/mark';
import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { CalculateTransform, isCalculate } from 'vega-lite/build/src/transform';
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

const CATEGORY_NONE = '"None"';

export function applyCategory(
  vlProc: VegaLiteSpecProcessor,
  categoryAction: Interactions.CategoryAction,
  selectionGroups: SelectionInteractionGroups
) {
  const { categoryName, selectedOption } = categoryAction;

  vlProc.updateTopLevelTransform(transforms => {
    if (
      !transforms
        .filter(isCalculate)
        .find(c => c.as === categoryName && c.calculate === CATEGORY_NONE)
    ) {
      const calcT: CalculateTransform = {
        calculate: CATEGORY_NONE,
        as: categoryName
      };

      transforms.push(calcT);
    }

    return transforms;
  });

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

  const { mark, encoding = {} } = spec;
  const { shape, color } = encoding;

  const markType = getMark(mark);
  const hasColorEncoded =
    !!color && (!isValueDef(color) || isConditionalDef(color));
  const hasShapeEncoded =
    !!shape && (!isValueDef(shape) || isConditionalDef(shape));

  if (markType === 'bar') {
    const existingColorEncoding = spec.encoding?.color;

    if (existingColorEncoding) {
      if (isConditionalDef(existingColorEncoding)) {
        delete existingColorEncoding.condition.value;

        spec.encoding = addEncoding(spec.encoding, 'color', {
          ...existingColorEncoding,
          condition: {
            ...existingColorEncoding.condition,
            field: categoryName
          }
        });
      }
    } else {
      spec.encoding = addEncoding(spec.encoding, 'color', {
        field: categoryName,
        type: 'nominal'
      });
    }
  } else if (!markType) {
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

  const markStr = getMark(mark);

  const hasColorEncoded =
    !!color && (!isValueDef(color) || isConditionalDef(color));
  const hasShapeEncoded =
    !!shape && (!isValueDef(shape) || isConditionalDef(shape));

  if (markStr === 'bar') {
    spec.encoding = addEncoding(spec.encoding, 'color', {
      field: categoryName,
      type: 'nominal'
    });
  } else if (!markStr) {
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
