import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

export type ColumnDataTypeMap = Record<string, string>;

// Action
export type ChangeColumnTypeAction = BaseInteraction & {
  type: 'column_type_change';
  columnDataTypes: ColumnDataTypeMap;
};

// Action Creator
export function createChangeColumnTypeActionAndLabelLike(
  columnDataTypes: ColumnDataTypeMap
): ActionAndLabelLike<ChangeColumnTypeAction> {
  return {
    action: {
      id: UUID(),
      type: 'column_type_change',
      columnDataTypes
    },
    label: () => {
      const changes = Object.entries(columnDataTypes);

      if (changes.length === 1) {
        return `Changed column '${changes[0][0]}' type to '${changes[0][1]}'`;
      }

      if (changes.length > 1) {
        return `Changed types for ${changes.length} columns`;
      }

      return 'Change columns';
    }
  };
}

// Command
export type ChangeColumnTypeCommandArgs = BaseCommandArg & {
  columnDataTypes: ColumnDataTypeMap;
};

// Command Option
export const changeColumnTypeCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, columnDataTypes } =
      castArgs<ChangeColumnTypeCommandArgs>(args);

    const { action, label } =
      createChangeColumnTypeActionAndLabelLike(columnDataTypes);

    return cell.trrackManager.apply(action, label);
  },
  label: 'Reorder Columns'
};
