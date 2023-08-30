import { State, extend, hookstate } from '@hookstate/core';
import { LocalStored, StoreEngine, localstored } from '@hookstate/localstored';
import { Subscribable, subscribable } from '@hookstate/subscribable';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE5_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { Signal } from '@lumino/signaling';
import { FlavoredId, NodeId } from '@trrack/core';
import { notifyPredictions, updatePredictions } from '../intent/intent_helpers';
import { Predictions } from '../intent/types';
import { ROW_ID } from '../interactions/apply';
import { TabKey } from '../sidebar/component';
import { TrrackManager } from '../trrack';
import { getSelectionsFromTrrackManager } from '../trrack/helper';
import { IDEGlobal, Nullable } from '../utils';
import { VegaManager } from '../vegaL';
import { getDatasetFromVegaView } from '../vegaL/helpers';
import { Vega } from '../vegaL/renderer';
import { Spec, VegaLiteSpecProcessor } from '../vegaL/spec';
import {
  GeneratedDataframes,
  defaultGenerateDataframes,
  extractDataframe
} from './output';
import { OutputCommandRegistry } from './output/commands';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const VEGALITE_MIMETYPE = VEGALITE5_MIME_TYPE;
export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

export const SHOW_AGG_OG_KEY = 'show_aggregate_original';
export const ACTIVE_TAB = 'active_tab';
export const GENERATED_DATAFRAMES = '__GENERATED_DATAFRAMES__';

type UpdateCause = 'execute' | 'update';

export function getCellStoreEngine(cell: TrrackableCell): StoreEngine {
  return {
    getItem(key: string) {
      return cell.model.getMetadata(key);
    },
    setItem(key: string, value: string) {
      const savedValue = cell.model.setMetadata(key, value);

      return savedValue;
    },
    removeItem(key: string) {
      return cell.model.deleteMetadata(key);
    }
  };
}

export class TrrackableCell extends CodeCell {
  private _trrackManager: TrrackManager;
  predictionsCache: Map<NodeId, Predictions> = new Map();

  warnings: string[] = [];
  commandRegistry: OutputCommandRegistry;
  currentNode: State<NodeId, any>;
  row_id_label = ROW_ID;

  data: Record<string, any>[] = [];
  originalData: Record<string, any>[] | null = null;
  columns: string[] = [];
  selectedRows: Record<string, any>[] = [];

  // Generated dataframes
  generatedDataframes = hookstate<GeneratedDataframes, LocalStored>(
    defaultGenerateDataframes,
    localstored({
      key: GENERATED_DATAFRAMES,
      engine: getCellStoreEngine(this),
      initializer: () => {
        const genDf: GeneratedDataframes =
          this.model.getMetadata(GENERATED_DATAFRAMES) ||
          defaultGenerateDataframes;

        return Promise.resolve(genDf);
      }
    })
  );

  // Active Tab
  activeTab = hookstate<TabKey, LocalStored>(
    'trrack',
    localstored({
      key: ACTIVE_TAB,
      engine: getCellStoreEngine(this),
      initializer: () =>
        Promise.resolve(this.model.getMetadata(ACTIVE_TAB) || 'trrack')
    })
  );

  // Predictions
  predictions = hookstate<Predictions, Subscribable>([], subscribable());
  newPredictionsLoaded = hookstate<boolean>(false);
  isLoadingPredictions = hookstate<boolean>(false);

  // Selections
  _selections = hookstate<Array<string>, Subscribable>([], subscribable());

  // aggregate original status
  showAggregateOriginal = hookstate<boolean, Subscribable & LocalStored>(
    true,
    extend(
      localstored({
        key: SHOW_AGG_OG_KEY,
        engine: getCellStoreEngine(this),
        initializer: () => {
          return Promise.resolve(!!this.model.getMetadata(SHOW_AGG_OG_KEY));
        }
      }),
      subscribable()
    )
  );

  // Apply
  isApplying = hookstate<boolean, Subscribable>(true, subscribable());

  _vegaManager = hookstate<Nullable<VegaManager>>(null); // to track vega renderer instance

  cellUpdateStatus: Nullable<UpdateCause> = null; // to track cell update status

  unsubscribeArray: Set<() => void> = new Set();

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.currentNode = hookstate(this._trrackManager.root);

    this.commandRegistry = new OutputCommandRegistry(this); // create command registry for toolbar commands

    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes
    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender

    const predUnsub = this.predictions.subscribe(predictions => {
      this.newPredictionsLoaded.set(predictions.length > 0);

      if (predictions.length > 0) {
        notifyPredictions(true, predictions.length);
      }
    });

    this.unsubscribeArray.add(predUnsub);

    const showAggOriginalUnsub = this.showAggregateOriginal.subscribe(
      async () => {
        await this.vegaManager?.update();
      }
    );

    this.unsubscribeArray.add(showAggOriginalUnsub);

    this._trrackManager.currentChange.connect(async (_tm, cc) => {
      // Set current node
      const id = cc.currentNode.id;
      this.currentNode.set(id);

      this.isLoadingPredictions.set(false);

      if (
        this._trrackManager.root === id &&
        this._trrackManager.trrack.root.children.length === 0
      ) {
        this.generatedDataframes.nodeDataframes.set({});
        await IDEGlobal.saveNotebook();
      }

      if (!this.vegaManager) {
        return;
      }

      const graphDf = this.generatedDataframes.graphDataframes.ornull;

      if (graphDf) {
        if (graphDf.graphId.get() !== this.trrackManager.root) {
          graphDf.graphId.set(this.trrackManager.root);
        }

        await extractDataframe(
          this,
          this.trrackManager.current,
          graphDf.name.get() || ''
        );
      }

      // Get data from vega view
      const data = getDatasetFromVegaView(
        this.vegaManager.view,
        this.trrackManager
      );

      // get selected points
      await this._getSelectedPoints(data.values);

      // get cached predictions
      const predictions: Predictions = this.predictionsCache.get(id) || [];

      const lastInteraction = this._trrackManager.trrack.getState();

      // The predictions failing can affect other kernel requests
      // This is fixed by asking the executor to not stop on error
      if (
        predictions.length === 0 && // if there  are no predictions
        this.selections.length > 0 && // and atleast one selected point
        this.executionSpec && // and the execution spec is defined
        (lastInteraction.type === 'selection' ||
          lastInteraction.type === 'invert-selection' ||
          lastInteraction.type === 'intent')
      ) {
        const vlProc = VegaLiteSpecProcessor.init(this.executionSpec); // Get processor object

        if (vlProc.nonAggregateNumericFeatures.length > 1) {
          await updatePredictions(
            this,
            id,
            this.selections.slice(),
            data,
            vlProc.nonAggregateNumericFeatures,
            this.row_id_label
          );
        }
      } else {
        this.predictions.set([]);
      }
    });
  }

  get selectionsState() {
    return this.selectedRows.length > 0 ? this.selectedRows : this._selections;
  }

  get selections() {
    return this._selections.get();
  }
  get vegaManagerState() {
    return this._vegaManager;
  }

  get vegaManager() {
    return this._vegaManager.get();
  }

  private async _getSelectedPoints(data: any[]): Promise<string[]> {
    const selections = await getSelectionsFromTrrackManager(
      this.trrackManager,
      data,
      this.row_id_label
    );

    this._selections.set(selections);

    return Promise.resolve(selections);
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

    this.unsubscribeArray.forEach(f => f());
    this.unsubscribeArray.clear();

    this.vegaManager?.dispose();
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

    // if (output.metadata.dataframeOnly) {
    //   output.setData({
    //     metadata: {
    //       ...output.metadata,
    //       cellId: this.cellId
    //     }
    //   });

    //   return;
    // }

    const { dataframeOnly = false } = output.metadata;

    if (output.type === 'display_data') {
      if (!dataframeOnly) {
        return;
      }
    } else if (output.type !== 'execute_result' || metadata.cellId) {
      return;
    }

    this.cellUpdateStatus = 'execute';

    output.setData({
      metadata: {
        ...output.metadata,
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
