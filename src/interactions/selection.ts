import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';

import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

export type SelectionStore = Array<{
  field: string;
  type: 'E' | 'R';
  channel: string;
}>;

export type SelectionValueType = {
  name: string;
  value: SelectionParameter['value'];
  store: SelectionStore;
};

// Action
export type SelectionAction = BaseInteraction &
  Pick<TopLevelSelectionParameter, 'views'> & {
    type: 'select';
  } & SelectionValueType;

// Action Creator
export function createSelectionActionAndLabelLike(
  selected: SelectionValueType
): ActionAndLabelLike<SelectionAction> {
  return {
    action: {
      id: UUID(),
      type: 'select',
      ...selected
    },
    label: () => {
      return 'Range selection over...';
    }
  };
}

// Command
export type SelectionCommandArgs = BaseCommandArg &
  SelectionValueType & {
    name: string;
  };

// Command Option
export const intervalSelectionCommandOption: CommandRegistry.ICommandOptions = {
  execute(args: ReadonlyPartialJSONObject) {
    const { cell, name, value, store } = castArgs<SelectionCommandArgs>(args);
    const actions = cell.trrackActions;

    if (!actions) {
      return;
    }

    const { action, label } = createSelectionActionAndLabelLike({
      value,
      name,
      store
    });

    return actions.select(action, label);
  }
};
