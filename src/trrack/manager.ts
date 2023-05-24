import { ISignal, Signal } from '@lumino/signaling';
import { NodeId, Trigger } from '@trrack/core';
import { TrrackableCell } from '../cells/trrackableCell';
import { getDataFromVegaSpec } from '../interactions/apply';
import { Executor } from '../notebook';
import { Disposable, IDEGlobal } from '../utils';
import { Spec } from '../vegaL/spec';
import { Trrack, TrrackOps } from './init';
import { TrrackActions } from './types';

const TRRACK_GRAPH_KEY = 'trrack_graph';

export type TrrackCurrentChange = {
  currentNode: NodeId;
  trigger: Trigger | 'reset';
  state: ReturnType<Trrack['getState']>;
};

export async function generateDF(dfName: string, spec: Spec) {
  const data = await getDataFromVegaSpec(spec);

  if (data.length === 0) return;

  const code = `df = pd.read_json('${JSON.stringify(
    data
  )}')\nIDE.DataFrameStorage.add('${dfName}', df)`;

  const output = await IDEGlobal.executor.execute(
    Executor.withPandas(Executor.withJson(Executor.withIDE(code)))
  );

  return output;
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

    this.currentChange.connect(() => {
      const vm = IDEGlobal.vegaManager.get(this._cell);

      if (!vm) return;

      const id = this.current;

      const dfName = 'df_' + id.substring(0, 5).replace('-', '_');

      generateDF(dfName, vm.spec);
    });
  }

  get savedGraph(): string | undefined {
    const graph = this._cell.model.getMetadata(TRRACK_GRAPH_KEY) as
      | string
      | undefined;

    return typeof graph === 'string' ? graph : JSON.stringify(graph);
  }

  get hasSelections() {
    const interaction = this._cell.trrackManager.trrack.getState();

    if (interaction.type === 'point' || interaction.type === 'interval') {
      const { value } = interaction;

      return !!value;
    }

    return false;
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

  private _cleanUpDatasets() {
    const nodes = this._trrack.graph.backend.nodes;
    Object.keys(nodes).forEach(id => {
      IDEGlobal.Datasets.datasetStatusMap.delete(id);
      // Also cleanup from server
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
      trigger: 'reset',
      currentNode: this._trrack.current.id,
      state: this._trrack.getState()
    });

    return { trrack, actions };
  }

  private _saveTrrackGraphToModel() {
    this._cell.model.setMetadata(
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
