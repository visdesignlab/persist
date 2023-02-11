import { Cell } from '@jupyterlab/cells';
import { ISignal, Signal } from '@lumino/signaling';
import { initializeTrrack, NodeId, Registry } from '@trrack/core';
import { TrrackedCodeCell } from '../cell';

type State = {
  msg: string;
};

const initialState: State = {
  msg: 'Hello, World!'
};

type Options = State | string;

function setupTrrack(loadFrom?: Options) {
  const registry = Registry.create();

  const testAction = registry.register('test', (state, msg) => {
    state.msg = msg;
  });

  let trrack = initializeTrrack({
    registry,
    initialState
  });

  if (loadFrom && typeof loadFrom === 'string') {
    trrack.import(loadFrom);
  } else if (loadFrom && typeof loadFrom !== 'string') {
    trrack = initializeTrrack({
      registry,
      initialState: loadFrom
    });
  }

  return {
    trrack,
    actions: {
      testAction
    }
  };
}

export type TrrackInstance = ReturnType<typeof setupTrrack>['trrack'];

export class TrrackOps {
  private static _trrackMap: Map<string, TrrackInstance> = new Map();

  static has(cell: Cell) {
    return this._trrackMap.has(cell.model.id);
  }

  static get(cellOrId: Cell | string): TrrackInstance {
    const id = typeof cellOrId === 'string' ? cellOrId : cellOrId.model.id;

    const instance = this._trrackMap.get(id);
    if (!instance) {
      throw new Error(`TrrackInstance does not exist for cell: ${id}`);
    }
    return instance;
  }

  static add(cell: Cell, trrack: TrrackInstance, override = false) {
    if (!override && this.has(cell)) {
      throw new Error(
        `TrrackInstance already exists for cell: ${cell.model.id}`
      );
    }

    this._trrackMap.set(cell.model.id, trrack);
  }
}

export class Trrack {
  private _actions: ReturnType<typeof setupTrrack>['actions'] | null = null;
  private _trrackChangeSignal = new Signal<this, string>(this);

  constructor(private _cell: TrrackedCodeCell) {
    if (!TrrackOps.has(this.cell)) {
      const savedGraph = _cell.model.metadata.get('trrack') as
        | string
        | undefined;

      const { trrack, actions } = setupTrrack(savedGraph);
      this._actions = actions;

      TrrackOps.add(this.cell, trrack);
    }

    if (!this._actions) {
      throw new Error("Trrack's actions are undefined");
    }

    this.trrack.currentChange(() => {
      this._announceCurrentChanged();
    });

    this._announceCurrentChanged();
  }

  // Private
  private _currentChanged = new Signal<this, string>(this);

  private _announceCurrentChanged() {
    this._currentChanged.emit(this.current);
  }

  // Methods
  undo() {
    this.trrack.undo();
  }

  redo() {
    this.trrack.undo();
  }

  to(id: NodeId) {
    this.trrack.to(id);
  }

  serialize() {
    return this.trrack.export();
  }

  reset() {
    const { trrack, actions } = setupTrrack();
    this._actions = actions;

    TrrackOps.add(this.cell, trrack, true);

    this.trrack.currentChange(() => {
      this._announceCurrentChanged();
    });
  }

  // Accessors
  get trrack(): TrrackInstance {
    const _trrack = TrrackOps.get(this.cell);
    if (!_trrack) {
      throw new Error(
        'Trrack instance not found for cell: ' + this.cell.model.id
      );
    }

    return _trrack;
  }

  get currentChanged(): ISignal<this, string> {
    return this._currentChanged;
  }

  get actions() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._actions!;
  }

  get cell() {
    return this._cell;
  }

  get current() {
    return this.trrack.current.id;
  }

  get root() {
    return this.trrack.root.id;
  }

  get trrackChange(): ISignal<this, string> {
    return this._trrackChangeSignal;
  }
}
