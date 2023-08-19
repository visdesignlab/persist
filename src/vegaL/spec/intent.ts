import { SelectionInteractionGroups } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { VegaLiteSpecProcessor } from './processor';

export function applyIntentSelection(
  vlProc: VegaLiteSpecProcessor,
  intent: Interactions.IntentSelectionAction,
  selectionGroups: SelectionInteractionGroups
) {
  selectionGroups;

  console.log(intent);

  return vlProc;
}
