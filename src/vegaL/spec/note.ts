import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { Note } from '../../interactions/types';
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

export function applyNote(vlProc: VegaLiteSpecProcessor, note: Note) {
  const { params = [] } = vlProc;

  const selections = params.filter(isSelectionParameter);

  const filterOutPredicates = getFiltersFromSelections(selections);
  const outFilter = invertFilter(createLogicalOrPredicate(filterOutPredicates)); // to filter out pre-aggregate points

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  const baseLayerName = OUT_FILTER_LAYER;
  vlProc.addLayer(baseLayerName, spec => addBaseLayer(spec, outFilter));

  const inFilter = invertFilter(outFilter); // to filter in ''noted' nodes

  vlProc.addLayer('NOTE_LAYER', spec =>
    addNoteLayer(
      spec,
      inFilter,
      `${new Date(note.createdOn).toISOString()}: ${note.note}`
    )
  );

  return vlProc;
}

function addBaseLayer(spec: AnyUnitSpec, filter: Filter): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  const { transform = [] } = spec;

  spec.transform = transform;

  return spec;
}

function addNoteLayer(spec: AnyUnitSpec, filter: Filter, note: string) {
  spec = addFilterTransform(spec, filter);

  spec.encoding = addEncoding(spec.encoding, 'tooltip', {
    value: note
  });

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}
