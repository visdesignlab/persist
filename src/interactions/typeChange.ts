import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

// Action
export type TypeChangeAction = BaseInteraction & {
  type: 'type-change';
  column: string;
  newType: string;
};

// Action Creator
export function createTypeChangeActionAndLabelLike(
  column: string,
  newType: string
): ActionAndLabelLike<TypeChangeAction> {
  return {
    action: {
      id: UUID(),
      type: 'type-change',
      column,
      newType
    },
    label: () => {
      return 'Change type';
    }
  };
}

// Command
export type TypeChangeCommandArgs = BaseCommandArg & {
  column: string;
  newType: string;
};

// Command Option
export const typeChangeCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, column, newType } = castArgs<TypeChangeCommandArgs>(args);

    const { action, label } = createTypeChangeActionAndLabelLike(
      column,
      newType
    );

    return cell.trrackManager.apply<TypeChangeAction>(action, label);
  },
  label: 'Change type'
};
