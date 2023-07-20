import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { Note } from '../../interactions/types';
import { AggregateOperation } from '../../vegaL/spec/aggregate';
import { TrrackableCell } from '../trrackableCell';
import { extractDfAndCopyName } from './extract_helpers';

import { InputDialog } from '@jupyterlab/apputils';
import { Nullable } from '../../utils';

export namespace OutputCommandIds {
  export const copyDynamic = 'output:copy-dynamic';
  export const reset = 'output:reset';
  export const filter = 'output:filter';
  export const aggregateSum = 'output:aggregate-sum';
  export const aggregateMean = 'output:aggregate-mean';
  export const aggregateGroup = 'output:aggregate-group';
  export const labelSelection = 'output:label';
  export const addNote = 'output:note';
}

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

    this._commands.addCommand(OutputCommandIds.aggregateSum, {
      execute: () => {
        aggregateBySum(this._cell);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Aggregate By Sum'
    });

    this._commands.addCommand(OutputCommandIds.aggregateMean, {
      execute: () => {
        aggregateByMean(this._cell);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Aggregate By Mean'
    });

    this._commands.addCommand(OutputCommandIds.aggregateGroup, {
      execute: () => {
        aggregateGroupBy(this._cell);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Group'
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

    this._commands.addCommand(OutputCommandIds.copyDynamic, {
      execute: () => {
        extractDfAndCopyName(this._cell);
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
  if (!label) return Promise.resolve();

  const id = UUID.uuid4();

  return await cell.trrackManager.actions.addLabel({
    id,
    label,
    type: 'label'
  });
}

export async function addNote(cell: TrrackableCell, note: Nullable<Note>) {
  if (!note) return Promise.resolve();

  const id = UUID.uuid4();

  return await cell.trrackManager.actions.addNote({
    id,
    note,
    type: 'note'
  });
}

export async function aggregateBySum(cell: TrrackableCell) {
  return aggregate(cell, 'sum');
}

export async function aggregateByMean(cell: TrrackableCell) {
  return aggregate(cell, 'mean');
}

export async function aggregateGroupBy(cell: TrrackableCell) {
  return aggregate(cell, 'group');
}

export async function aggregate(cell: TrrackableCell, op: AggregateOperation) {
  const id = UUID.uuid4();

  return await cell.trrackManager.actions.addAggregate(
    {
      id,
      agg_name: `_Agg_${id.split('-')[0]}`,
      type: 'aggregate',
      op
    },
    op === 'group' ? 'Group selected points' : `Aggregate by: ${op}`
  );
}

async function filter(cell: TrrackableCell, direction: 'in' | 'out' = 'out') {
  return await cell.trrackManager.actions.addFilter({
    id: UUID.uuid4(),
    type: 'filter',
    direction
  });
}
