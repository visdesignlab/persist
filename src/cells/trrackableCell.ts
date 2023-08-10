import { State, hookstate } from '@hookstate/core';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE5_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { Signal } from '@lumino/signaling';
import { FlavoredId, NodeId } from '@trrack/core';
import { getIntents } from '../intent/getIntents';
import { Predictions } from '../intent/types';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { TrrackManager } from '../trrack';
import { IDEGlobal, IDELogger, Nullable } from '../utils';
import { VegaManager } from '../vegaL';
import { getDatasetFromVegaView } from '../vegaL/helpers';
import { Vega } from '../vegaL/renderer';
import { Spec } from '../vegaL/spec';
import { OutputCommandRegistry } from './output/commands';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const VEGALITE_MIMETYPE = VEGALITE5_MIME_TYPE;
export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

type UpdateCause = 'execute' | 'update';

export class TrrackableCell extends CodeCell {
  private _trrackManager: TrrackManager;
  private _predictionsCache: Map<NodeId, Predictions> = new Map();

  warnings: string[] = [];
  commandRegistry: OutputCommandRegistry;
  currentNode: State<NodeId, any>;

  // Predictions
  predictions = hookstate<Predictions>([]);
  isLoadingPredictions = hookstate<boolean>(false);

  _vegaManager = hookstate<Nullable<VegaManager>>(null); // to track vega renderer instance
  cellUpdateStatus: Nullable<UpdateCause> = null; // to track cell update status

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.currentNode = hookstate(this._trrackManager.root);

    this.commandRegistry = new OutputCommandRegistry(this); // create command registry for toolbar commands

    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender
    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes

    this._trrackManager.currentChange.connect(async (tm, cc) => {
      if (!this.vegaManager) {
        return;
      }

      const id = cc.currentNode.id;
      this.currentNode.set(id);

      let predictions: Nullable<Predictions> = this._predictionsCache.get(id);

      if (!predictions && tm.hasSelections) {
        const interactions = getInteractionsFromRoot(tm, tm.current);
        const data = getDatasetFromVegaView(
          this.vegaManager.view,
          this.trrackManager
        );

        try {
          this.isLoadingPredictions.set(true);
          predictions = await getIntents(data, interactions);
        } catch (err) {
          console.error(err);
        } finally {
          // Debug different types of predictions. TODO: tomorrow
          predictions = [];
          this.isLoadingPredictions.set(false);
        }

        this._predictionsCache.set(id, predictions);
      } else {
        predictions = predictions || [];
      }

      this.predictions.set(predictions);
    });

    IDELogger.log(`Created TrrackableCell ${this.cellId}`);
  }

  get vegaManagerState() {
    return this._vegaManager;
  }

  get vegaManager() {
    return this._vegaManager.get();
  }

  createVegaManager(vega: Vega) {
    const vm = VegaManager.create(this, vega);

    this._vegaManager.set(vm);

    return this.vegaManager;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    Signal.clearData(this);
    IDEGlobal.cells.delete(this.cellId);

    this._trrackManager.dispose();

    super.dispose();
  }

  get cellId(): TrrackableCellId {
    return this.model.id;
  }

  get trrackId() {
    return this._trrackManager.root;
  }

  get trrackManager() {
    return this._trrackManager;
  }

  get executionSpec() {
    return this._getFromMetadata<Spec>(TRRACK_EXECUTION_SPEC);
  }

  addSpecToMetadata(spec: Spec) {
    const isExecute = this.cellUpdateStatus === 'execute';

    if (!isExecute) {
      return;
    }

    this.model.setMetadata(TRRACK_EXECUTION_SPEC, spec as any);
  }

  updateVegaSpec(spec: Spec) {
    const outputs = this.model.outputs.toJSON();
    const executeResultOutputIdx = outputs.findIndex(
      o => o.output_type === 'execute_result'
    );

    if (executeResultOutputIdx === -1) {
      return;
    }

    const output = this.model.outputs.get(executeResultOutputIdx);

    if (output.type !== 'execute_result') {
      return;
    }

    this.cellUpdateStatus = 'update';

    output.setData({
      data: {
        [VEGALITE_MIMETYPE]: spec as any
      }
    });
  }

  private _getFromMetadata<T>(key: string): Nullable<T> {
    return this.model.getMetadata(key);
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    args: IOutputAreaModel.ChangedArgs
  ) {
    const { type, newIndex } = args;

    if (type !== 'add') {
      return;
    }
    const output = model.get(newIndex);

    const metadata = output.metadata;

    if (output.type !== 'execute_result' || metadata.cellId) {
      return;
    }

    this.cellUpdateStatus = 'execute';

    output.setData({
      metadata: {
        cellId: this.cellId
      }
    });
  }
}

export namespace TrrackableCell {
  export function create(options: CodeCell.IOptions): TrrackableCell {
    const cell = new TrrackableCell(options);

    IDEGlobal.cells.set(cell.cellId, cell);

    return cell;
  }

  export function isTrrackableCell(cell: Cell): cell is TrrackableCell {
    return cell instanceof TrrackableCell;
  }
}
