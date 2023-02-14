import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { NodeId } from '@trrack/core';
import { TrrackedCellManager } from '../trracked-cell/cell-manager';
import { defaultActions, Trrack, TrrackActions, TrrackOps } from './creator';

export class TrrackManager implements IDisposable {
  private _trrack: Trrack | null = null;
  private _actions: TrrackActions | null = null;
  private _trrackChangeSignal = new Signal<this, Trrack | null>(this);
  private _isDisposed = false;

  constructor(private _cellManager: TrrackedCellManager) {}

  init() {
    const { trrack, actions } = TrrackOps.create(this._cellManager.savedGraph);
    this._trrack = trrack;
    this._actions = actions;

    this._isDisposed = false;

    this._trrack.currentChange(this._announceCurrentChanged.bind(this));

    this._trrackChangeSignal.emit(this._trrack);
    this._announceCurrentChanged();
  }

  dispose() {
    if (this._isDisposed) return;

    this._isDisposed = true;
    this._trrack = null;
    this._actions = null;
    // this._trrackChangeSignal.emit(null);
  }

  // Private
  get isDisposed() {
    return this._isDisposed;
  }

  private _currentChanged = new Signal<this, string>(this);

  private _announceCurrentChanged() {
    if (this._trrack) this._currentChanged.emit(this._trrack.current.id);
  }

  // Methods
  undo() {
    if (this._trrack) this._trrack.undo();
  }

  redo() {
    if (this._trrack) this._trrack.undo();
  }

  to(id: NodeId) {
    if (this._trrack) this._trrack.to(id);
  }

  serialize() {
    if (this._trrack) return this._trrack.export();
  }

  get currentChanged(): ISignal<this, string> {
    return this._currentChanged;
  }

  get trrack() {
    return this._trrack;
  }

  get actions() {
    if (this._actions) return this._actions;
    return defaultActions;
  }

  get trrackChange(): ISignal<this, Trrack | null> {
    return this._trrackChangeSignal;
  }
}
