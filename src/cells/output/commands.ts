import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { TrrackableCell } from '../trrackableCell';

export namespace OutputCommandIds {
  export const reset = 'output:reset';
  export const filter = 'output:filter';
  export const aggregate = 'output:aggregate';
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
      label: 'Filter'
    });

    this._commands.addCommand(OutputCommandIds.aggregate, {
      execute: () => {
        aggregate(this._cell);
      },
      label: 'Aggregate'
    });

    this._cell.trrackManager.currentChange.connect((_, __) => {
      this._commands.notifyCommandChanged();
    });
  }
}

async function aggregate(cell: TrrackableCell) {
  await cell.trrackManager.actions.addAggregate({
    id: UUID.uuid4(),
    type: 'aggregate'
  });
}

async function filter(cell: TrrackableCell) {
  await cell.trrackManager.actions.addFilter({
    id: UUID.uuid4(),
    type: 'filter'
  });
}
