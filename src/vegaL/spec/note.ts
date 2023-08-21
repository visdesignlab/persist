import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { ROW_ID } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { pipe } from '../../utils/pipe';
import { addEncoding } from './encoding';
import {
  Filter,
  addFilterTransform,
  createOneOfPredicate,
  invertFilter
} from './filter';
import { ProcessedResult } from './getProcessed';
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
  processedResults: ProcessedResult
) {
  const { selected } = processedResults;

  const selectionOutPredicate = invertFilter(
    createOneOfPredicate(ROW_ID, selected)
  );

  vlProc.updateTopLevelParameter(param =>
    isSelectionParameter(param) ? removeParameterValue(param) : param
  );

  vlProc.addLayer(BASE_LAYER, spec =>
    addBaseLayer(spec, selectionOutPredicate)
  );

  vlProc.addLayer(noteAction.id, spec =>
    addNoteLayer(
      spec,
      invertFilter(selectionOutPredicate),
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

function addNoteLayer(
  spec: AnyUnitSpec,
  filter: Filter | Filter[],
  note: string
) {
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
