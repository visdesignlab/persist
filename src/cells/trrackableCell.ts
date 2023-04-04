import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { JSONValue } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../constants';
import { VEGALITE_MIMETYPE } from '../renderers';
import { FlavoredId, IDEGlobal, IDELogger } from '../utils';
import { OutputHeaderWidget } from './outputHeader';
import { ITrrackManager, TrrackManager } from './trrack/trrackManager';
import { VegaManager } from './trrack/vega';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

export function isTrrackableCell(cell: Cell): cell is TrrackableCell {
  return cell instanceof TrrackableCell;
}

export class TrrackableCell extends CodeCell {
  private _trrackManager: ITrrackManager;
  private _vegaManager: VegaManager;
  private _hasExecuted = false;

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager
    this._vegaManager = new VegaManager(this); // Setup vega manager

    IDEGlobal.cells.set(this.cellId, this);

    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender
    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes

    if (!this._trrackChangeHandler)
      this._trrackManager.changed.connect(
        // Add a listener for when trrack instance changes
        this._trrackChangeHandler,
        this
      );

    IDELogger.log(`Created TrrackableCell ${this.cellId}`);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    Signal.clearData(this);
    IDEGlobal.cells.delete(this.cellId);
    this._trrackManager.dispose();
    this._vegaManager.dispose();
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

  get vegaManager() {
    return this._vegaManager;
  }

  get hasExecuted() {
    return this._hasExecuted;
  }

  set hasExecuted(value: boolean) {
    this._hasExecuted = value;
  }

  get executionSpec() {
    return this.model.metadata.get(TRRACK_EXECUTION_SPEC);
  }

  /**
   * Get the output area widget to setup
   */
  updateOutputHeaderWidget(outputHeader: OutputHeaderWidget) {
    outputHeader.associateCell(this);
    // const nWidgets = layout.widgets.length;

    // console.log(nWidgets);
    // if (nWidgets < 2 || nWidgets > 3)
    //   throw new Error('Unexpected number of widgets in output area');

    // if (nWidgets === 3) return;

    // const widget = new OutputHeaderWidget(this);
    // layout.insertWidget(0, widget);
  }

  addSpecToMetadata(spec: JSONValue) {
    this.model.metadata.set(TRRACK_EXECUTION_SPEC, spec);
  }

  updateVegaSpec(spec?: JSONValue) {
    if (!this.hasExecuted) this.hasExecuted = true;

    if (!spec) return;
    const outputs = this.model.outputs.toJSON();
    const executeResultOutputIdx = outputs.findIndex(
      o => o.output_type === 'execute_result'
    );

    if (executeResultOutputIdx === -1) return;

    const output = this.model.outputs.get(executeResultOutputIdx);

    if (output.type !== 'execute_result') return;

    output.setData({
      data: {
        [TRRACK_MIME_TYPE]: {
          [VEGALITE_MIMETYPE]: spec,
          [TRRACK_GRAPH_MIME_TYPE]: this.cellId
        }
      },
      metadata: output.metadata || {}
    });
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    args: IOutputAreaModel.ChangedArgs
  ) {
    const { type, newIndex } = args;

    if (type !== 'add') return;
    const output = model.get(newIndex);

    if (output.type === 'execute_result') {
      if (output.data[TRRACK_MIME_TYPE]) return;

      if (!this.hasExecuted) {
        this.hasExecuted = true;
        const spec = output.data[VEGALITE_MIMETYPE];
        if (spec) {
          this.addSpecToMetadata(spec as JSONValue);
          this._outputChangeListener(model, args);
          return;
        }
      }

      output.setData({
        data: {
          [TRRACK_MIME_TYPE]: {
            ...output.data,
            [TRRACK_GRAPH_MIME_TYPE]: this.cellId
          }
        },
        metadata: output.metadata || {}
      });

      this.vegaManager.update();
      this.trrackManager.loadDataFramesForAll();
    }
  }

  // Trrack
  private _trrackChangeHandler() {
    const outputs = this.model.outputs.toJSON();
    const executeResultOutputIdx = outputs.findIndex(
      o => o.output_type === 'execute_result'
    );

    if (executeResultOutputIdx === -1) return;

    const output = this.model.outputs.get(executeResultOutputIdx);

    if (output.type !== 'execute_result') return;

    output.setData({
      // Wrong
      data: output.data,
      metadata: output.metadata || {}
    });
  }
}
