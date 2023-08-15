import { ISignal, Signal } from '@lumino/signaling';
import { NodeId, Trigger } from '@trrack/core';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { extractDataframe } from '../cells/output/extract_helpers';
import { TrrackableCell } from '../cells/trrackableCell';
import { Disposable, Nullable } from '../utils';
import { Trrack, TrrackOps } from './init';
import { TrrackActions, TrrackNode } from './types';
import { getDatasetFromVegaView } from '../vegaL/helpers';
import { SelectionInitMapping } from 'vega-lite/build/src/selection';

const TRRACK_GRAPH_KEY = 'trrack_graph';

export type TrrackCurrentChange = {
  currentNode: TrrackNode;
  trigger: Trigger | 'reset';
  state: ReturnType<Trrack['getState']>;
};

export const DATAFRAME_VARIABLE_NAME = 'DATAFRAME_VARIABLE_NAME ';

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

    this.currentChange.connect(async (_, { currentNode }) => {
      const nodeVariableName = trrack.metadata.latestOfType<string>(
        DATAFRAME_VARIABLE_NAME,
        currentNode.id
      )?.val;

      if (nodeVariableName) {
        await extractDataframe(_cell, currentNode.id, nodeVariableName);
      }
    });
  }

  get savedGraph(): Nullable<string> {
    const graph = this._cell.model.getMetadata(TRRACK_GRAPH_KEY) as
      | string
      | undefined;

    // return null for no graph
    if (!graph) {
      return null;
    }

    // Stringify and load graph
    if (typeof graph !== 'string') {
      return JSON.stringify(graph);
    }

    // return uncompressed graph
    if (
      graph.includes('current') &&
      graph.includes('root') &&
      graph.includes('nodes')
    ) {
      return graph;
    }

    // decompress and return uncompressed graph
    return decompressFromUTF16(graph);
  }

  get hasSelections() {
    const interaction = this._cell.trrackManager.trrack.getState();

    if (interaction.type === 'selection') {
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

  private _reset(loadGraph: boolean) {
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
        currentNode: this._trrack.current,
        state: this._trrack.getState()
      });
    });

    this.currentChange.connect(this._saveTrrackGraphToModel, this);

    this._trrackInstanceChange.emit(this._trrack.root.id);
    this._trrackCurrentChange.emit({
      trigger: 'reset',
      currentNode: this._trrack.current,
      state: this._trrack.getState()
    });

    return { trrack, actions };
  }

  private _saveTrrackGraphToModel() {
    this._cell.model.setMetadata(
      TRRACK_GRAPH_KEY,
      compressToUTF16(this._trrack.export())
    );
  }

  calculateSelections(vegaView: any) {
    const interaction = this._cell.trrackManager.trrack.getState();

    if (interaction.type === 'selection') {
      const { value: currSelection } = interaction;

      console.log(currSelection);
      const points = getDatasetFromVegaView(vegaView);

      if (!currSelection) {
        return [];
      }

      console.log(interaction);
      if ((interaction.select as any).type === 'point') {
        return [];
      } else if ((interaction.select as any).type === 'interval') {
        const keys = Object.keys(currSelection);
        const filteredPoints = points.filter(
          (p: Record<string, any>) =>
            !keys.find(
              key =>
                !(
                  p[key] >= (currSelection as any)[key][0] &&
                  p[key] <= (currSelection as any)[key][1]
                )
            )
        );
        console.log(filteredPoints);
        return filteredPoints;
      }
    }

    return [];
  }

  getSelectedColumns(vegaView: any) {
    const interaction = this._cell.trrackManager.trrack.getState();

    if (interaction.type === 'selection') {
      const { value: currSelection } = interaction;

      console.log(currSelection);
      const points = getDatasetFromVegaView(vegaView);

      if (!currSelection) {
        return [];
      }

      if ((interaction.select as any).type === 'point') {
        return (currSelection as SelectionInitMapping[])
          .map(select => Object.keys(select))
          .flat();
      } else if ((interaction.select as any).type === 'interval') {
        const keys = Object.keys(currSelection);
        return keys;
      }
    }

    return [];
  }

  saveVariableNameToNodeMetadata(varName: string) {
    this._trrack.metadata.add({ [DATAFRAME_VARIABLE_NAME]: varName });
    this._saveTrrackGraphToModel();
  }

  getVariableNameFromNodeMetadata(id: NodeId = this._trrack.current.id) {
    return this._trrack.metadata.latestOfType<string>(
      DATAFRAME_VARIABLE_NAME,
      id
    )?.val;
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
