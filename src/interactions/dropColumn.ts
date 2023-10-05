import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

// Action
export type DropColumnsAction = BaseInteraction & {
  type: 'drop-columns';
  columns: string[];
};

// Action Creator
export function createDropColumnsActionAndLabelLike(
  columns: string[]
): ActionAndLabelLike<DropColumnsAction> {
  return {
    action: {
      id: UUID(),
      type: 'drop-columns',
      columns
    },
    label: () => {
      return columns.length > 1
        ? `Drop ${columns.length} columns`
        : `Drop column ${columns[0]}`;
    }
  };
}

// Command
export type DropColumnsCommandArgs = BaseCommandArg & {
  columns: string[];
};

// Command Option
export const dropColumnsCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, columns } = castArgs<DropColumnsCommandArgs>(args);

    const { action, label } = createDropColumnsActionAndLabelLike(columns);

    return cell.trrackManager.apply(action, label);
  },
  label: 'Drop Columns'
};
