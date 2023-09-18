import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import {
  SelectionCommandArg,
  createSelectionActionAndLabelLike
} from '../interactions/selection';

export namespace PersistCommands {
  // Reset Trrack
  export const resetTrrack = 'persist:trrack:reset';

  // Selections
  export const pointSelection = 'persist:selection:point';
  export const intervalSelection = 'persist:selection:interval';
  export const intentSelection = 'persist:selection:intent';
  export const invertSelection = 'persist:selection:invert';
  export const clearSelection = 'persist:selection:clear';

  // Filters
  export const filterOut = 'persist:filter:out';
  export const filterIn = 'persist:filter:in';

  // Column Ops
  export const sortByColumn = 'persist:column:sort';
  export const reorderColumns = 'persist:column:order';
  export const renameColumns = 'persist:column:rename';
  export const dropColumns = 'persist:column:drop';

  // Annotation
  export const annotate = 'persist:annotate';

  // Dataframe
  export const generateStaticDf = 'persist:dataframe:genstatic';
  export const generateDynamicDf = 'persist:dataframe:gendynamic';
}

type CommandArgMap = {
  [PersistCommands.intervalSelection]: SelectionCommandArg;
};

export class PersistCommandRegistry {
  private _commandsDisposeMap = new Map<string, IDisposable>();
  private _commands: CommandRegistry = new CommandRegistry();

  constructor() {
    this.addCommand(PersistCommands.resetTrrack, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.pointSelection, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.intervalSelection, {
      execute(args) {
        const { cell, selection, value, store, encodingTypes } =
          args as unknown as SelectionCommandArg;
        const actions = cell.trrackActions;

        if (!actions) {
          return;
        }

        const { action, label } = createSelectionActionAndLabelLike(selection, {
          value,
          store,
          encodingTypes
        });

        return actions.select(action, label);
      }
    });
    this.addCommand(PersistCommands.intentSelection, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.invertSelection, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.clearSelection, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.filterOut, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.filterIn, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.sortByColumn, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.reorderColumns, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.renameColumns, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.dropColumns, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.annotate, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.generateStaticDf, {
      execute() {
        //
      }
    });
    this.addCommand(PersistCommands.generateDynamicDf, {
      execute() {
        //
      }
    });
  }

  addCommand(id: string, opts: CommandRegistry.ICommandOptions) {
    const disposable = this._commands.addCommand(id, opts);

    this._commandsDisposeMap.set(id, disposable);
  }

  removeCommand(id: string) {
    if (!this._commands.hasCommand(id)) {
      return false;
    }

    const disposable = this._commandsDisposeMap.get(id);
    if (!disposable) {
      return false;
    }

    disposable.dispose();
    this._commandsDisposeMap.delete(id);
    return true;
  }

  execute<K extends keyof CommandArgMap>(id: K, args: CommandArgMap[K]) {
    return this._commands.execute(
      id,
      args as unknown as ReadonlyPartialJSONObject
    );
  }
}
