import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

// Action
export type EditCellAction = BaseInteraction & {
  type: 'edit_cell';
  columnName: string;
  idx: string;
  value: any;
};

// Action Creator
export function createEditCellActionAndLabelLike(
  columnName: string,
  idx: string,
  value: any
): ActionAndLabelLike<EditCellAction> {
  return {
    action: {
      id: UUID(),
      type: 'edit_cell',
      columnName,
      idx,
      value
    },
    label: () => {
      return `Updated column '${columnName}', idx ${idx} to '${value}'`;
    }
  };
}

// Command
export type EditCellCommandArgs = BaseCommandArg & {
  columnName: string;
  idx: string;
  value: any;
};

// Command Option
export const editCellCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, columnName, idx, value } =
      castArgs<EditCellCommandArgs>(args);

    const { action, label } = createEditCellActionAndLabelLike(
      columnName,
      idx,
      value
    );

    return cell.trrackManager.apply(action, label);
  },
  label: 'Reorder Columns'
};
