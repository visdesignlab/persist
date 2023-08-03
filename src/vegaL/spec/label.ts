import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { pipe } from '../../utils/pipe';
import { addEncoding } from './encoding';
import {
  Filter,
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

export function applyLabel(vlProc: VegaLiteSpecProcessor, label: string) {
  label;
  const { params = [] } = vlProc;

  const selections = params.filter(isSelectionParameter);

  const filterOutPredicates = getFiltersFromSelections(selections);
  const outFilter = invertFilter(createLogicalOrPredicate(filterOutPredicates)); // to filter out pre-aggregate points

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  const baseLayerName = OUT_FILTER_LAYER;
  vlProc.addLayer(baseLayerName, spec => addBaseLayer(spec, outFilter));

  const inFilter = invertFilter(outFilter); // to filter in labelled nodes
  vlProc.addLayer('LABEL_LAYER', spec => addLabelLayer(spec, inFilter, label));

  return vlProc;
}

function addBaseLayer(spec: AnyUnitSpec, filter: Filter): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  spec.transform = transform;

  return spec;
}

function addLabelLayer(spec: AnyUnitSpec, filter: Filter, label: string) {
  spec = addFilterTransform(spec, filter);

  spec.encoding = addEncoding(spec.encoding, 'tooltip', {
    value: label
  });

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}
