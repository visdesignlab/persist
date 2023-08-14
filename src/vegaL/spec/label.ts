import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { SelectionInteractionGroups } from '../../interactions/apply';
import { pipe } from '../../utils/pipe';
import { addEncoding } from './encoding';

import { Interactions } from '../../interactions/types';
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

export function applyLabel(
  vlProc: VegaLiteSpecProcessor,
  labelAction: Interactions.LabelAction,
  selectionGroups: SelectionInteractionGroups
) {
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
    addBaseLayer(spec, currentSelectionFilterOutPredicate)
  );

  vlProc.addLayer(labelAction.id, spec =>
    addLabelLayer(spec, comboFilters, labelAction.label)
  );

  return vlProc;
}

function addBaseLayer(spec: AnyUnitSpec, filter: Filter): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  return spec;
}

function addLabelLayer(spec: AnyUnitSpec, filter: Filter[], label: string) {
  spec = addFilterTransform(spec, filter);

  if (!spec.encoding?.tooltip) {
    spec.encoding = addEncoding(spec.encoding, 'tooltip', {
      value: label
    });
  }

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}
