import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';

import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';
import { parseStringify } from '../utils/jsonHelpers';

export type SelectionStore = Array<{
  field: string;
  type: 'E' | 'R';
  channel: string;
  values: Array<any>;
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
export const selectionCommandOption: CommandRegistry.ICommandOptions = {
  execute(args: ReadonlyPartialJSONObject) {
    const { cell, name, value, store } = castArgs<SelectionCommandArgs>(args);

    const { action, label } = createSelectionActionAndLabelLike({
      value,
      name,
      store: parseStringify(store)
    });

    return cell.trrackManager.apply(action, label);
  }
};
