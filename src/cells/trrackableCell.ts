import { State, extend, hookstate } from '@hookstate/core';
import { LocalStored, StoreEngine, localstored } from '@hookstate/localstored';
import { Subscribable, subscribable } from '@hookstate/subscribable';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE5_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { Signal } from '@lumino/signaling';
import { FlavoredId, NodeId } from '@trrack/core';
import { updatePredictions } from '../intent/getIntents';
import { Predictions } from '../intent/types';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { Interactions } from '../interactions/types';
import { Executor } from '../notebook';
import { TrrackManager } from '../trrack';
import { IDEGlobal, IDELogger, Nullable } from '../utils';
import { VegaManager } from '../vegaL';
import { getDatasetFromVegaView } from '../vegaL/helpers';
import { Vega } from '../vegaL/renderer';
import { Spec, VegaLiteSpecProcessor } from '../vegaL/spec';
import { stringifyForCode } from './output';
import { OutputCommandRegistry } from './output/commands';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const VEGALITE_MIMETYPE = VEGALITE5_MIME_TYPE;
export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

export const SHOW_AGG_OG_KEY = 'show_aggregate_original';

type UpdateCause = 'execute' | 'update';

export function getCellStoreEngine(cell: TrrackableCell): StoreEngine {
  return {
    getItem(key: string) {
      return cell.model.getMetadata(key);
    },
    setItem(key: string, value: string) {
      return cell.model.setMetadata(key, value);
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

  // Predictions
  predictions = hookstate<Predictions, Subscribable>([], subscribable());
  newPredictionsLoaded = hookstate<boolean>(false);
  isLoadingPredictions = hookstate<boolean>(false);

  // Selections
  _selections = hookstate<number[], Subscribable>([], subscribable());

  // aggregate original status
  showAggregateOriginal = hookstate<boolean, Subscribable & LocalStored>(
    false,
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

  _vegaManager = hookstate<Nullable<VegaManager>>(null); // to track vega renderer instance
  cellUpdateStatus: Nullable<UpdateCause> = null; // to track cell update status

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.currentNode = hookstate(this._trrackManager.root);

    this.commandRegistry = new OutputCommandRegistry(this); // create command registry for toolbar commands

    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender
    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes

    this.predictions.subscribe(predictions =>
      this.newPredictionsLoaded.set(predictions.length > 0)
    );

    this.showAggregateOriginal.subscribe(async () => {
      await this.vegaManager?.update();
    });

    this._trrackManager.currentChange.connect(async (tm, cc) => {
      if (!this.vegaManager) {
        return;
      }

      const interactions = getInteractionsFromRoot(tm, tm.current);
      const data = getDatasetFromVegaView(
        this.vegaManager.view,
        this.trrackManager
      );

      await this._getSelectedPoints(data.values, interactions);

      const id = cc.currentNode.id;
      this.currentNode.set(id);

      let predictions: Predictions = this.predictionsCache.get(id) || [];

      if (
        predictions.length === 0 &&
        this.selections.length > 0 &&
        this.executionSpec
      ) {
        const vlProc = VegaLiteSpecProcessor.init(this.executionSpec);

        console.log(vlProc.features);

        predictions = await updatePredictions(
          this,
          id,
          [...this.selections],
          data,
          vlProc.features
        );
      }

      this.predictions.set(predictions);
    });

    IDELogger.log(`Created TrrackableCell ${this.cellId}`);
  }

  get selectionsState() {
    return this._selections;
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

  private async _getSelectedPoints(
    data: any[],
    interactions: Interactions
  ): Promise<string[]> {
    let sels: Interactions = [];

    interactions.forEach(interaction => {
      if (
        ['selection', 'invert-selection', 'intent'].includes(interaction.type)
      ) {
        sels.push(interaction);
      } else {
        sels = [];
      }
    });

    if (sels.length === 0) {
      this._selections.set([]);
      return Promise.resolve([]);
    }

    const code = Executor.withIDE(`
PR.get_selections(${stringifyForCode(data)}, ${stringifyForCode(sels)});
`);

    const result = await Executor.execute(code);

    if (result.status === 'ok') {
      const content = result.content;

      console.log(content);

      let parsedString = content[0].substring(1, content[0].length - 1);
      parsedString = `[${parsedString}]`;

      const arr = JSON.parse(parsedString);

      this._selections.set(arr);
    } else {
      console.error(result.err);
      this._selections.set([]);
      throw new Error(result.err);
    }

    return Promise.resolve([]);
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
