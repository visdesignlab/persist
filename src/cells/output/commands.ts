import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { TrrackableCell } from '../trrackableCell';

export namespace OutputCommandIds {
  export const reset = 'output:reset';
  export const filter = 'output:filter';
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

    this._cell.trrackManager.currentChange.connect((_, __) => {
      this._commands.notifyCommandChanged();
    });
  }
}

async function filter(cell: TrrackableCell) {
  console.log('?');

  await cell.trrackManager.actions.addFilter({
    id: UUID.uuid4(),
    type: 'filter',
    path: ''
  });
}
