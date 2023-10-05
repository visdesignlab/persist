import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

export type SortDirection = 'asc' | 'desc';

export type ColumnSortStatus = {
  column: string;
  direction: SortDirection;
};

export type TableSortStatus = Array<ColumnSortStatus>;

// Action
export type SortByColumnAction = BaseInteraction & {
  type: 'sortby-column';
  sortStatus: TableSortStatus;
};

// Action Creator
export function createSortByColumnActionAndLabelLike(
  sortStatus: TableSortStatus
): ActionAndLabelLike<SortByColumnAction> {
  return {
    action: {
      id: UUID(),
      type: 'sortby-column',
      sortStatus
    },
    label: () => {
      return sortStatus.length === 1
        ? `Sort by ${sortStatus[0].column}`
        : `Sort by ${sortStatus.length} columns`;
    }
  };
}

// Command
export type SortByColumnCommandArgs = BaseCommandArg & {
  sortStatus: TableSortStatus;
};

// Command Option
export const sortbyColumnCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, sortStatus } = castArgs<SortByColumnCommandArgs>(args);

    const { action, label } = createSortByColumnActionAndLabelLike(sortStatus);

    return cell.trrackManager.apply(action, label);
  },
  label: 'Sort Column'
};
