import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { ROW_ID, SelectionInteractionGroups } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { VegaLiteSpecProcessor } from './processor';

export const NEVER_TRIGGER_EVENT_STREAM = '@__dummy__stream';

export function applyIntentSelection(
  vlProc: VegaLiteSpecProcessor,
  intentAction: Interactions.IntentSelectionAction,
  _selectionGroups: SelectionInteractionGroups
) {
  const values = intentAction.intent.members.map(v => ({ [ROW_ID]: v }));

  // remove selections from graph
  vlProc.updateTopLevelParameter(param => {
    if (!isSelectionParameter(param)) {
      return param;
    }

    if (typeof param.select === 'string') {
      console.log(param.select);
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

    console.log(param);

    return param;
  });

  return vlProc;
}
