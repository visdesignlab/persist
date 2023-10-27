import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

type RenameColumnMap = Record<string, string>;

// Action
export type RenameColumnAction = BaseInteraction & {
  type: 'rename_column';
  renameColumnMap: RenameColumnMap;
};

// Action Creator
export function createRenameColumnActionAndLabelLike(
  renameColumnMap: RenameColumnMap
): ActionAndLabelLike<RenameColumnAction> {
  return {
    action: {
      id: UUID(),
      type: 'rename_column',
      renameColumnMap
    },
    label: () => {
      const entries = Object.entries(renameColumnMap);

      if (entries.length === 0) {
        return 'Rename Action';
      }

      if (entries.length === 1) {
        return `Rename column ${entries[0][0]} to ${entries[0][1]}`;
      }

      return `Rename ${entries.length} columns`;
    }
  };
}

// Command
export type RenameColumnCommandArgs = BaseCommandArg & {
  renameColumnMap: RenameColumnMap;
};

// Command Option
export const renameColumnCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, renameColumnMap } = castArgs<RenameColumnCommandArgs>(args);

    const { action, label } =
      createRenameColumnActionAndLabelLike(renameColumnMap);

    return cell.trrackManager.apply(action, label);
  },
  label: 'Rename Column'
};
