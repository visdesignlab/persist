import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { TrrackableCell } from '../trrackableCell';
import { extractDfAndCopyName } from './extract_helpers';

export namespace OutputCommandIds {
  export const reset = 'output:reset';
  export const filter = 'output:filter';
  export const aggregate = 'output:aggregate';
  export const copyDynamic = 'output:copy-dynamic';
}

export class OutputCommandRegistry {
  private _commands: CommandRegistry;

  constructor(private _cell: TrrackableCell) {
    this._commands = new CommandRegistry();

    if (!this._cell) return;
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
      execute: () => {
        aggregate(this._cell);
      },
      isEnabled: () => {
        return this._cell.trrackManager.hasSelections;
      },
      label: 'Aggregate'
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

async function aggregate(cell: TrrackableCell) {
  const id = UUID.uuid4();

  await cell.trrackManager.actions.addAggregate({
    id,
    agg_name: `Agg_${id.split('-')[0]}`,
    type: 'aggregate'
  });
}

async function filter(cell: TrrackableCell, direction: 'in' | 'out' = 'out') {
  await cell.trrackManager.actions.addFilter({
    id: UUID.uuid4(),
    type: 'filter',
    direction
  });
}
