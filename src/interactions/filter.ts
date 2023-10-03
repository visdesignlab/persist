import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import {
  ActionAndLabelLike,
  BaseCommandArg,
  BaseInteraction,
  hasSelections
} from './base';
import { castArgs } from '../utils/castArgs';

export type FilterDirection = 'in' | 'out';

// Action
export type FilterAction = BaseInteraction & {
  type: 'filter';
  direction: FilterDirection;
};

// Action Creator
export function createFilterActionAndLabelLike(
  direction: FilterDirection
): ActionAndLabelLike<FilterAction> {
  return {
    action: {
      id: UUID(),
      type: 'filter',
      direction
    },
    label: () => {
      return direction === 'out'
        ? 'Filter selected items'
        : 'Keep selected items';
    }
  };
}

// Command
export type FilterCommandArgs = BaseCommandArg & {
  direction: FilterDirection;
};

// Command Option
export const filterCommandOption: CommandRegistry.ICommandOptions = {
  isEnabled(args) {
    return hasSelections(args);
  },
  execute(args) {
    const { cell, direction } = castArgs<FilterCommandArgs>(args);

    const actions = cell.trrackActions;

    if (!actions) {
      return;
    }

    const { action, label } = createFilterActionAndLabelLike(direction);

    return actions.filter(action, label);
  },
  label: args => {
    const { direction } = castArgs<FilterCommandArgs>(args);

    return direction === 'out' ? 'Filter out' : 'Filter in';
  }
};
