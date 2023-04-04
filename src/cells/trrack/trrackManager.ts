import { ISignal, Signal } from '@lumino/signaling';
import { NodeId, Trigger } from '@trrack/core';
import { extractDatasetForTrrackNode } from '../../notebook';
import { Interaction } from '../../types';
import { Disposable, IDEGlobal } from '../../utils';
import { TrrackableCell } from '../trrackableCell';
import { State, Trrack, TrrackActions, TrrackOps } from './init';

const TRRACK_GRAPH_KEY = 'trrack_graph';
export const DF_NAME = 'df_name';

export type TrrackCurrentChange = {
  currentNode: NodeId;
  trigger: Trigger;
  state: ReturnType<Trrack['getState']>;
};

export type ITrrackManager = TrrackManager;

async function generateNameAndSaveDataframe(
  state: State,
  cell: TrrackableCell,
  currentNode: NodeId
) {
  const trrack = cell.trrackManager.trrack;

  let interactionType: 'filter' | 'selection' | 'root';

  const interactions = state.interactions;
  const interaction = interactions[interactions.length - 1];

  const type = interaction ? interaction.type : 'root';

  switch (type) {
    case 'filter':
      interactionType = 'filter';
      break;
    case 'selection_interval':
    case 'selection_multiple':
    case 'selection_single':
      interactionType = 'selection';
      break;
    case 'root':
      interactionType = 'root';
      break;
    default:
      return;
  }

  const dfName = `data_${interactionType}_${currentNode.split('-')[0]}`;

  if (trrack.metadata.latestOfType(DF_NAME)?.val !== dfName) {
    trrack.metadata.add({
      [DF_NAME]: dfName
    });
  }

  return extractDatasetForTrrackNode(cell);
}

export class TrrackManager extends Disposable {
  private _trrack: Trrack;
  private _actions: TrrackActions;
  private _trrackInstanceChange = new Signal<this, string>(this);
  private _trrackCurrentChange = new Signal<this, TrrackCurrentChange>(this);

  constructor(private _cell: TrrackableCell) {
    super();
    const { trrack, actions } = this._reset(true);

    this._trrack = trrack;
    this._actions = actions;

    this._trrackCurrentChange.connect(
      (_manager, { trigger, currentNode, state }) => {
        generateNameAndSaveDataframe(state, this._cell, currentNode);
      }
    );
  }

  get savedGraph(): string | undefined {
    const graph = this._cell.model.metadata?.get(TRRACK_GRAPH_KEY) as
      | string
      | undefined;
    return typeof graph === 'string' ? graph : JSON.stringify(graph);
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

  get currentChange(): ISignal<this, TrrackCurrentChange> {
    return this._trrackCurrentChange;
  }

  get root() {
    return this._trrack.root.id;
  }

  get current() {
    return this._trrack.current.id;
  }

  async addInteraction(interaction: Interaction, _label?: string) {
    await this.trrack.apply(
      interaction.type,
      this.actions.addInteractionAction(interaction)
    );
  }

  private _cleanUpDatasets() {
    const nodes = this._trrack.graph.backend.nodes;
    Object.keys(nodes).forEach(id => {
      IDEGlobal.Datasets.datasetStatusMap.delete(id);
      // Also cleanup from server
    });
  }

  loadDataFramesForAll() {
    Object.keys(this.trrack.graph.backend.nodes).forEach((a, i) => {
      if (i > 0) return;
      const node = this.trrack.graph.backend.nodes[a];
      generateNameAndSaveDataframe(this.trrack.getState(node), this._cell, a);
    });
  }

  private _reset(loadGraph: boolean) {
    if (this._trrack) {
      this._cleanUpDatasets();
    }

    this.currentChange.disconnect(this._saveTrrackGraphToModel, this);

    const { trrack, actions } = TrrackOps.create(
      loadGraph ? this.savedGraph : undefined
    );
    this._trrack = trrack;
    this._actions = actions;

    this._saveTrrackGraphToModel();

    this._trrack.currentChange((trigger?: Trigger) => {
      this._trrackCurrentChange.emit({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        trigger: trigger!,
        currentNode: this._trrack.current.id,
        state: this._trrack.getState()
      });
    });

    this.currentChange.connect(this._saveTrrackGraphToModel, this);

    this._trrackInstanceChange.emit(this._trrack.root.id);
    this._trrackCurrentChange.emit({
      trigger: 'new',
      currentNode: this._trrack.current.id,
      state: this._trrack.getState()
    });
    return { trrack, actions };
  }

  private _saveTrrackGraphToModel() {
    this._cell.model.metadata.set(
      TRRACK_GRAPH_KEY,
      JSON.parse(this._trrack.export())
    );
  }

  reset() {
    this._reset(false);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    Signal.clearData(this);
  }
}
