import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

// Action
export type ReorderColumnsAction = BaseInteraction & {
  type: 'reorder-column';
  columns: string[];
};

// Action Creator
export function createReorderColumnsActionAndLabelLike(
  columns: string[]
): ActionAndLabelLike<ReorderColumnsAction> {
  return {
    action: {
      id: UUID(),
      type: 'reorder-column',
      columns
    },
    label: () => {
      return 'Reorder columns';
    }
  };
}

// Command
export type ReorderColumnsCommandArgs = BaseCommandArg & {
  columns: string[];
};

// Command Option
export const reorderColumnsCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, columns } = castArgs<ReorderColumnsCommandArgs>(args);

    const { action, label } = createReorderColumnsActionAndLabelLike(columns);

    return cell.trrackManager.apply(action, label);
  },
  label: 'Reorder Columns'
};
