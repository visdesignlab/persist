import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { NodeId } from '@trrack/core';
import { Interaction } from '../../types/interaction';
import { Disposable } from '../../utils/disposable';
import { IDEGlobal } from '../../utils/IDEGlobal';
import { TrrackableCell } from '../trrackableCell';
import { Trrack, TrrackActions, TrrackOps } from './init';

const TRRACK_GRAPH_KEY = 'trrack_graph';

export interface ITrrackManager extends IDisposable {
  trrack: Trrack;
  actions: TrrackActions;
  root: NodeId;
  current: NodeId;
  isAtRoot: boolean;
  isAtLatest: boolean;
  hasOnlyRoot: boolean;
  savedGraph: string | undefined;
  changed: ISignal<ITrrackManager, string>;
  reset: () => void;
  addInteraction: (interaction: Interaction, label?: string) => Promise<void>;
}

export class TrrackManager extends Disposable implements ITrrackManager {
  private _trrack: Trrack;
  private _actions: TrrackActions;
  private _trrackInstanceChange = new Signal<this, string>(this);

  constructor(private _cell: TrrackableCell) {
    super();
    const { trrack, actions } = this._reset(true);

    this._trrack = trrack;
    this._actions = actions;
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

  get isAtRoot() {
    return this.current === this.root;
  }

  get isAtLatest() {
    return this._trrack.current.children.length === 0;
  }

  get hasOnlyRoot() {
    return this._trrack.root.children.length === 0;
  }

  get changed(): ISignal<this, string> {
    return this._trrackInstanceChange;
  }

  get root() {
    return this._trrack.root.id;
  }

  get current() {
    return this._trrack.current.id;
  }

  async addInteraction(interaction: Interaction, label?: string) {
    await this.trrack.apply(
      label ? label : interaction.type,
      this.actions.addInteractionAction(interaction)
    );
  }

  private _reset(loadGraph: boolean) {
    if (this._trrack) {
      IDEGlobal.trracks.delete(this._cell.cellId);
    }

    const { trrack, actions } = TrrackOps.create(
      loadGraph ? this.savedGraph : undefined
    );
    this._trrack = trrack;
    this._actions = actions;

    this._trrack.currentChange(() => {
      this._saveTrrackGraphToModel();
    });
    this._saveTrrackGraphToModel();

    this._trrackInstanceChange.emit(this._trrack.root.id);
    return { trrack, actions };
  }

  private _saveTrrackGraphToModel() {
    this._cell.model.metadata.set(TRRACK_GRAPH_KEY, this._trrack.export());
    IDEGlobal.trracks.set(this._cell.cellId, this);
  }

  reset() {
    this._reset(false);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    IDEGlobal.trracks.delete(this._cell.cellId);
    Signal.clearData(this);
  }
}
