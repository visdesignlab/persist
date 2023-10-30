import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';
import { MRT_SortingState } from 'mantine-react-table';

export type TableSortState = MRT_SortingState;

// Action
export type SortByColumnAction = BaseInteraction & {
  type: 'sortby_column';
  sortStatus: TableSortState;
};

// Action Creator
export function createSortByColumnActionAndLabelLike(
  sortStatus: TableSortState
): ActionAndLabelLike<SortByColumnAction> {
  return {
    action: {
      id: UUID(),
      type: 'sortby_column',
      sortStatus
    },
    label: () => {
      if (sortStatus.length === 0) {
        return 'Reset sorting';
      }

      const sortStrings = sortStatus.map(
        s => `Sort (${s.desc ? 'descending' : 'ascending'}) by '${s.id}'`
      );

      return sortStrings.length === 1
        ? sortStrings[0]
        : `Sort by ${sortStrings.length} columns. ${sortStrings.join('|\n')}`;
    }
  };
}

// Command
export type SortByColumnCommandArgs = BaseCommandArg & {
  sortStatus: TableSortState;
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
