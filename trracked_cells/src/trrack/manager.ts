import { Notification } from '@jupyterlab/apputils';
import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { TrrackedCell } from '../cells/trrackedCell';
import { Trrack, TrrackActions, TrrackOps } from './initTrrack';

const TRRACK_GRAPH_KEY = 'trrack_graph';

export class TrrackManager implements IDisposable {
  private _trrack: Trrack;
  private _actions: TrrackActions;
  private _trrackInstanceChange = new Signal<this, string>(this);
  private _isDisposed = false;

  constructor(private _cell: TrrackedCell) {
    const { trrack, actions } = this._reset(true);

    this._trrack = trrack;
    this._actions = actions;
  }

  get isDisposed() {
    return this._isDisposed;
  }

  get savedGraph(): string | undefined {
    return this._cell.model.metadata?.get(TRRACK_GRAPH_KEY) as
      | string
      | undefined;
  }

  get trrack() {
    return this._trrack;
  }

  get actions() {
    return this._actions;
  }

  get trrackInstanceChange(): ISignal<this, string> {
    return this._trrackInstanceChange;
  }

  get root() {
    return this._trrack.root.id;
  }

  get current() {
    return this._trrack.current.id;
  }

  private _reset(loadGraph: boolean) {
    if (this._trrack) window.trrackMap.delete(this._trrack.root.id);

    // Also acts as init
    const { trrack, actions } = TrrackOps.create(
      loadGraph ? this.savedGraph : undefined
    );
    this._trrack = trrack;
    this._actions = actions;

    this._trrack.currentChange(() => {
      Notification.manager.dismiss();
      Notification.info(this.trrack.current.label, {
        autoClose: 500
      });
      this._saveTrrackGraphToModel();
    });

    this._saveTrrackGraphToModel();
    this._trrackInstanceChange.emit(this._trrack.root.id);
    return { trrack, actions };
  }

  private _saveTrrackGraphToModel() {
    this._cell.model.metadata.set(TRRACK_GRAPH_KEY, this._trrack.export());
    window.trrackMap.set(this._trrack.root.id, this);
  }

  reset() {
    this._reset(false);
  }

  dispose() {
    if (this._isDisposed) return;
    window.trrackMap.delete(this._trrack.root.id);
    this._isDisposed = true;
  }
}
