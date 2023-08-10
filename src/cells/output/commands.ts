import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { Note } from '../../interactions/types';
import { AggregateOperation } from '../../vegaL/spec/aggregate';
import { TrrackableCell } from '../trrackableCell';
import { extractDfAndCopyName } from './extract_helpers';

import { InputDialog } from '@jupyterlab/apputils';
import { Nullable } from '../../utils';

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

export namespace OutputCommandIds {
  export const reset = 'output:reset';
  export const filter = 'output:filter';
  export const aggregate = 'output:aggregate';
  export const sort = 'output:sort';
  export const categorize = 'output:categorize';
  export const copyDynamic = 'output:copy-dynamic';
  export const labelSelection = 'output:label';
  export const addNote = 'output:note';
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

    this._commands.addCommand(OutputCommandIds.filter, {
      execute: () => {
        filter(this._cell);
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

    this._commands.addCommand(OutputCommandIds.copyDynamic, {
      execute: () => {
        extractDfAndCopyName(
          this._cell,
          this._cell.trrackManager.current,
          `df_${this._cell.trrackManager.root.substring(0, 5)}_dyn`
        );
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

async function filter(cell: TrrackableCell, direction: 'in' | 'out' = 'out') {
  return await cell.trrackManager.actions.addFilter({
    id: UUID.uuid4(),
    type: 'filter',
    direction
  });
}
