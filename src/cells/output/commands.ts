import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { Note } from '../../interactions/types';
import { AggregateOperation } from '../../vegaL/spec/aggregate';
import { TrrackableCell } from '../trrackableCell';

import { InputDialog } from '@jupyterlab/apputils';
import { SelectionParameter } from 'vega-lite/build/src/selection';
import {
  IntervalSelectionValue,
  PointSelectionValue,
  getIntervalSelectionInteractionLabel,
  getPointSelectionInteractionLabel
} from '../../interactions/selection';
import { Nullable } from '../../utils';

export type SelectionCommandArgs<Type extends 'point' | 'interval'> = {
  selector: SelectionParameter<Type>;
  value: Type extends 'point' ? PointSelectionValue : IntervalSelectionValue;
};

export type CategorizeCommandArgs = {
  category: string;
  selectedOption: string;
};

export type AggregateCommandArgs = {
  aggregateName: string;
  op: AggregateOperation;
};

export type SortCommandArgs = {
  direction: 'ascending' | 'descending';
  col: string;
};

export type ReorderCommandArgs = {
  value: string[];
};

export type EditValCommandArgs = {
  column: string;
  index: number;
  value: string;
};

export type RenameColumnCommandArgs = {
  prevColumnName: string;
  newColumnName: string;
};

export type DropColumnCommandArgs = {
  columnNames: string[];
};

export namespace OutputCommandIds {
  // Trrack
  export const reset = 'output:reset';

  // Selections
  export const pointSelection = 'output:point-selection';
  export const intervalSelection = 'output:interval-selection';
  export const invertSelection = 'output:invert-selection';
  export const intentSelection = 'output:intent-selection';

  // Filters
  export const filterOut = 'output:filter-out';
  export const filterIn = 'output:filter-in';

  // Aggregate
  export const aggregate = 'output:aggregate';
  export const sort = 'output:sort';
  export const reorder = 'output:reorder';

  export const editVal = 'output:editVal';

  export const showPreAggregate = 'output:pre-aggregate';

  // Categorize
  export const categorize = 'output:categorize';

  // Labelling
  export const labelSelection = 'output:label';

  // Note
  export const addNote = 'output:note';

  // Columns
  export const renameColumn = 'output:rename-column';
  export const dropColumns = 'output:drop-columns';

  // Dataframe generation
  export const copyDynamic = 'output:copy-dynamic';
}

// Maybe refactor this to be one instance and accept cell as args
export class OutputCommandRegistry {
  private _commands: CommandRegistry;

  constructor(private _cell: TrrackableCell) {
    this._commands = new CommandRegistry();

    if (!this._cell) {
      return;
    }
    this._setup();
  }

  get commands(): CommandRegistry {
    return this._commands;
  }

  private _setup() {
    this._commands.addCommand(OutputCommandIds.reset, {
      execute: () => {
        this._cell.trrackManager.reset();
      },
      isEnabled: () => !this._cell.trrackManager.hasOnlyRoot,
      label: 'Reset'
    });

    this._commands.addCommand(OutputCommandIds.pointSelection, {
      execute: args => {
        const { selector, value } =
          args as unknown as SelectionCommandArgs<'point'>;

        const label = getPointSelectionInteractionLabel(selector, value);

        this._cell.trrackManager.actions.addSelection(
          {
            type: 'selection',
            ...selector,
            id: UUID.uuid4(),
            selected: {} as any
          },
          label
        );
      }
    });

    this._commands.addCommand(OutputCommandIds.intervalSelection, {
      execute: args => {
        const { selector, value } =
          args as unknown as SelectionCommandArgs<'interval'>;

        const label = getIntervalSelectionInteractionLabel(selector, value);

        this._cell.trrackManager.actions.addSelection(
          {
            type: 'selection',
            ...selector,
            id: UUID.uuid4(),
            selected: {} as any
          },
          label
        );
      }
    });

    this._commands.addCommand(OutputCommandIds.invertSelection, {
      execute: () => {
        this._cell.trrackManager.actions.addInvertSelection({
          id: UUID.uuid4(),
          type: 'invert-selection'
        });
      },
      isEnabled: () => this._cell.trrackManager.hasSelections,
      label: 'Invert Selection'
    });

    this._commands.addCommand(OutputCommandIds.filterOut, {
      execute: () => {
        filter(this._cell);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Filter'
    });

    this._commands.addCommand(OutputCommandIds.filterIn, {
      execute: () => {
        filter(this._cell, 'in');
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Filter'
    });

    this._commands.addCommand(OutputCommandIds.aggregate, {
      execute: args => {
        const { op, aggregateName } = args as AggregateCommandArgs;

        aggregate(this._cell, aggregateName, op);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Aggregate'
    });

    this._commands.addCommand(OutputCommandIds.sort, {
      execute: args => {
        const { direction, col } = args as SortCommandArgs;

        sort(this._cell, direction, col);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Sort'
    });

    this._commands.addCommand(OutputCommandIds.editVal, {
      execute: args => {
        const { column, index, value } = args as EditValCommandArgs;

        editVal(this._cell, value, index, column);
      },
      isEnabled: () => {
        return true;
      },
      label: 'Edit value'
    });

    this._commands.addCommand(OutputCommandIds.reorder, {
      execute: args => {
        const { value } = args as ReorderCommandArgs;

        reorderColumns(this._cell, value);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Reorder'
    });

    this._commands.addCommand(OutputCommandIds.labelSelection, {
      execute: async () => {
        const { value } = await InputDialog.getText({
          title: 'Label',
          placeholder: 'Enter the label here'
        });

        return labelSelection(this._cell, value);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Label Selection',
      caption: 'Label the current selection'
    });

    this._commands.addCommand(OutputCommandIds.addNote, {
      execute: async () => {
        const { value } = await InputDialog.getText({
          title: 'Add Note',
          placeholder: 'Enter your note here'
        });

        return addNote(
          this._cell,
          value
            ? {
                createdOn: Date.now(),
                note: value
              }
            : null
        );
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Add Note',
      caption: 'Add note to selection'
    });

    this._commands.addCommand(OutputCommandIds.categorize, {
      execute: args => {
        const { category, selectedOption } = args as CategorizeCommandArgs;
        categorize(this._cell, category, selectedOption);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Assign Categories'
    });

    this._commands.addCommand(OutputCommandIds.renameColumn, {
      execute: args => {
        const { prevColumnName, newColumnName } =
          args as RenameColumnCommandArgs;

        renameColumn(this._cell, prevColumnName, newColumnName);
      },
      label: 'Rename column',
      caption: 'Rename the currently selected column'
    });

    this._commands.addCommand(OutputCommandIds.dropColumns, {
      execute: args => {
        const { columnNames } = args as DropColumnCommandArgs;

        dropColumns(this._cell, columnNames);
      },
      label: 'Drop column',
      caption: 'Drop the selected columns'
    });

    this._commands.addCommand(OutputCommandIds.copyDynamic, {
      execute: () => {
        // TODO:
      },
      label: 'Create Dynamic Dataframe',
      caption:
        'Generate variable which has the dataframe for current provenance node'
    });

    this._cell.trrackManager.currentChange.connect((_, __) => {
      this._commands.notifyCommandChanged();
    });
  }
}

export async function labelSelection(
  cell: TrrackableCell,
  label: Nullable<string>
) {
  if (!label) {
    return Promise.resolve();
  }

  const id = UUID.uuid4();

  return await cell.trrackManager.actions.addLabel({
    id,
    label,
    type: 'label'
  });
}

async function categorize(
  cell: TrrackableCell,
  categoryName: string,
  selectedOption: string
) {
  const id = UUID.uuid4();

  await cell.trrackManager.actions.addCategory({
    id,
    type: 'categorize',
    categoryName,
    selectedOption
  });
}

export async function addNote(cell: TrrackableCell, note: Nullable<Note>) {
  if (!note) {
    return Promise.resolve();
  }

  const id = UUID.uuid4();

  return await cell.trrackManager.actions.addNote({
    id,
    note,
    type: 'note'
  });
}

export async function aggregate(
  cell: TrrackableCell,
  aggregateName: string,
  op: AggregateOperation
) {
  const id = UUID.uuid4();

  return await cell.trrackManager.actions.addAggregate(
    {
      id,
      agg_name: aggregateName,
      type: 'aggregate',
      op
    },
    op === 'group' ? 'Group selected points' : `Aggregate by: ${op}`
  );
}

export async function sort(
  cell: TrrackableCell,
  direction: 'ascending' | 'descending',
  col: string
) {
  const id = UUID.uuid4();

  return await cell.trrackManager.actions.sort(
    {
      id,
      type: 'sort',
      direction: direction,
      col: col
    },
    `Sort by ${col}`
  );
}

export async function editVal(
  cell: TrrackableCell,
  value: string,
  index: number,
  col: string
) {
  const id = UUID.uuid4();

  return await cell.trrackManager.actions.editValue(
    {
      id,
      type: 'editVal',
      index: index,
      value: value,
      column: col
    },
    `Edit value to ${value}`
  );
}

export async function reorderColumns(cell: TrrackableCell, value: string[]) {
  const id = UUID.uuid4();

  return await cell.trrackManager.actions.reorder(
    {
      id,
      type: 'reorder',
      value: value
    },
    'Reorder columns'
  );
}

async function filter(cell: TrrackableCell, direction: 'in' | 'out' = 'out') {
  return await cell.trrackManager.actions.addFilter({
    id: UUID.uuid4(),
    type: 'filter',
    direction
  });
}

async function dropColumns(cell: TrrackableCell, columnNames: string[]) {
  return await cell.trrackManager.actions.addDropColumnInteraction({
    id: UUID.uuid4(),
    type: 'drop-columns',
    columnNames
  });
}

async function renameColumn(
  cell: TrrackableCell,
  prevColumnName: string,
  newColumnName: string
) {
  return await cell.trrackManager.actions.addRenameColumnInteraction({
    id: UUID.uuid4(),
    type: 'rename-column',
    newColumnName,
    prevColumnName
  });
}
