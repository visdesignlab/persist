import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';
import { Intent } from '../intent/types';
import { SelectionAction } from './selection';
import { SelectionValueType } from './selection';
import { SelectionCommandArgs } from './selection';
import { parseStringify } from '../utils/jsonHelpers';

// Action
export type IntentSelectionAction = BaseInteraction &
  Omit<SelectionAction, 'type'> & {
    type: 'intent';
    intent: Intent;
  };

// Action Creator
export function createIntentSelectionActionAndLabelLike(
  intent: Intent,
  selected: SelectionValueType
): ActionAndLabelLike<IntentSelectionAction> {
  return {
    action: {
      id: UUID(),
      type: 'intent',
      intent,
      ...selected
    },
    label: () => {
      return `Selected ${intent.intent}`;
    }
  };
}

// Command
export type IntentSelectionCommandArgs = BaseCommandArg &
  SelectionCommandArgs & {
    intent: Intent;
  };

// Command Option
export const intentSelectionCommandOption: CommandRegistry.ICommandOptions = {
  execute(args: ReadonlyPartialJSONObject) {
    const { intent, cell, name, value, store, brush_type } =
      castArgs<IntentSelectionCommandArgs>(args);

    const { action, label } = createIntentSelectionActionAndLabelLike(intent, {
      value,
      name,
      store: parseStringify(store),
      brush_type
    });

    return cell.trrackManager.apply(action, label);
  }
};
