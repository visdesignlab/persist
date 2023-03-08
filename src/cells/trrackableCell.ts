import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE4_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { JSONValue, ReadonlyJSONObject } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { PanelLayout } from '@lumino/widgets';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../constants';
import { Nullable } from '../types';
import { FlavoredId, IDEGlobal, IDELogger } from '../utils';
import { OutputHeaderWidget } from './outputHeader/OutputHeaderWidget';
import { ITrrackManager, TrrackManager } from './trrack/trrackManager';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export function isTrrackableCell(cell: Cell): cell is TrrackableCell {
  return cell instanceof TrrackableCell;
}

export class TrrackableCell extends CodeCell {
  private _trrackManager: ITrrackManager;

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

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

  /**
   * Get the output area widget to setup
   */
  addOutputWidget(layout: PanelLayout) {
    const nWidgets = layout.widgets.length;
    if (nWidgets < 2 || nWidgets > 3)
      throw new Error('Unexpected number of widgets in output area');

    if (nWidgets === 3) layout.removeWidgetAt(0);

    const widget = new OutputHeaderWidget(this);
    layout.insertWidget(0, widget);
  }

  saveOriginalSpec(spec: JSONValue) {
    this.model.metadata.set('original_spec', spec);
  }

  getoriginalSpec() {
    return this.model.metadata.get('original_spec') as Nullable<JSONValue>;
  }

  updateVegaSpec(spec: JSONValue) {
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
          [VEGALITE4_MIME_TYPE]: spec,
          [TRRACK_GRAPH_MIME_TYPE]: this.cellId
        }
      },
      metadata: output.metadata || {}
    });
  }

  private _handleClearCell(
    model: IOutputAreaModel,
    args: IOutputAreaModel.ChangedArgs
  ) {
    const { oldValues } = args;

    const wasCleared = model.length === 0 && oldValues.length > 0;
    if (!wasCleared) return;
    const output = oldValues[0];
    const hasTrrackOutput = output.data[
      TRRACK_MIME_TYPE
    ] as Nullable<ReadonlyJSONObject>;

    if (!hasTrrackOutput) return;

    const trrackId = hasTrrackOutput[
      TRRACK_GRAPH_MIME_TYPE
    ] as Nullable<string>;

    if (!trrackId) return;

    IDEGlobal.trracks.get(trrackId)?.reset();
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    args: IOutputAreaModel.ChangedArgs
  ) {
    const { type, newIndex } = args;

    if (type === 'remove') return this._handleClearCell(model, args);

    if (type !== 'add') return;
    const output = model.get(newIndex);

    if (output.type === 'execute_result') {
      if (output.data[TRRACK_MIME_TYPE]) return;

      output.setData({
        data: {
          [TRRACK_MIME_TYPE]: {
            ...output.data,
            [TRRACK_GRAPH_MIME_TYPE]: this.cellId
          }
        },
        metadata: output.metadata || {}
      });
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
