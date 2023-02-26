import { CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { Signal } from '@lumino/signaling';
import { PanelLayout } from '@lumino/widgets';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../constants';
import { FlavoredId } from '../utils/flavoredId';
import { IDEGlobal } from '../utils/IDEGlobal';
import { OutputHeaderWidget } from './outputHeader/OutputHeaderWidget';
import { ITrrackManager, TrrackManager } from './trrack/trrackManager';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export class TrrackableCell extends CodeCell {
  private _trrackManager: ITrrackManager;

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender
    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes

    this._trrackManager.changed.connect(
      // Add a listener for when trrack instance changes
      this._trrackChangeHandler,
      this
    );

    IDEGlobal.cells.set(this.cellId, this);
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
    const widget = new OutputHeaderWidget(this);
    layout.insertWidget(0, widget);
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
      data: output.data,
      metadata: output.metadata || {}
    });
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    { type, newIndex }: IOutputAreaModel.ChangedArgs
  ) {
    if (type !== 'add') return;
    const output = model.get(newIndex);

    if (output.type === 'execute_result') {
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
}
