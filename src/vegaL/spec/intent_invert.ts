import {
  SelectionParameter,
  isSelectionParameter
} from 'vega-lite/build/src/selection';
import { ROW_ID } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { ProcessedResult } from './getProcessed';
import { VegaLiteSpecProcessor } from './processor';

export const NEVER_TRIGGER_EVENT_STREAM = '@__dummy__stream';

export function applyInvertSelection(
  vlProc: VegaLiteSpecProcessor,
  { selected }: ProcessedResult
) {
  const values = selected.map(v => ({ [ROW_ID]: v }));

  // remove selections from graph
  vlProc.updateTopLevelParameter(param => {
    if (!isSelectionParameter(param)) {
      return param;
    }

    return applyValueSelectionToParam(param, values);
  });

  return vlProc;
}

export function applyIntentSelection(
  vlProc: VegaLiteSpecProcessor,
  _intentAction: Interactions.IntentSelectionAction,
  { selected }: ProcessedResult
) {
  const values = selected.map(v => ({ [ROW_ID]: v }));

  // remove selections from graph
  vlProc.updateTopLevelParameter(param => {
    if (!isSelectionParameter(param)) {
      return param;
    }

    return applyValueSelectionToParam(param, values);
  });

  return vlProc;
}

function applyValueSelectionToParam(
  param: SelectionParameter,
  values: any[]
): SelectionParameter {
  if (typeof param.select === 'string') {
    param.select = {
      type: 'point'
    };
  }

  if (typeof param.select !== 'string') {
    param.select.type = 'point';
    param.select.on = NEVER_TRIGGER_EVENT_STREAM;
    param.select.clear = NEVER_TRIGGER_EVENT_STREAM;
  }

  param.value = values;

  return param;
}
