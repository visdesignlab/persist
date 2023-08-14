import { isSelectionParameter } from 'vega-lite/build/src/selection';
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

export function applyNote(
  vlProc: VegaLiteSpecProcessor,
  noteAction: Interactions.NotesAction,
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

  vlProc.addLayer(noteAction.id, spec =>
    addNoteLayer(
      spec,
      comboFilters,
      `${new Date(noteAction.note.createdOn).toUTCString()} ${
        noteAction.note.note
      }`
    )
  );

  return vlProc;
}

function addBaseLayer(spec: AnyUnitSpec, filter: Filter): AnyUnitSpec {
  spec = addFilterTransform(spec, filter);

  return spec;
}

function addNoteLayer(spec: AnyUnitSpec, filter: Filter[], note: string) {
  spec = addFilterTransform(spec, filter);

  if (!spec.encoding?.tooltip) {
    spec.encoding = addEncoding(spec.encoding, 'tooltip', {
      value: note
    });
  }

  return pipe(
    removeUnitSpecName,
    removeUnitSpecSelectionParams,
    removeUnitSpecSelectionFilters
  )(spec);
}
