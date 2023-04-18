import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE4_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { JSONValue } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { FlavoredId } from '@trrack/core';
import { TrrackManager } from '../trrack';
import { IDEGlobal, IDELogger } from '../utils';
import { Vegalite4Spec } from '../vegaL/types';

export const VEGALITE_MIMETYPE = VEGALITE4_MIME_TYPE;

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

export class TrrackableCell extends CodeCell {
  private _trrackManager: TrrackManager;

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender
    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes

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

  get executionSpec(): Vegalite4Spec | null {
    return this.model.metadata.get(
      TRRACK_EXECUTION_SPEC
    ) as Vegalite4Spec | null;
  }

  addSpecToMetadata(spec: Vegalite4Spec) {
    const isExecute = IDEGlobal.cellUpdateStatus.get(this) === 'execute';

    if (!isExecute) return;

    this.model.metadata.set(TRRACK_EXECUTION_SPEC, spec as JSONValue);
  }

  updateVegaSpec(spec: Vegalite4Spec) {
    const outputs = this.model.outputs.toJSON();
    const executeResultOutputIdx = outputs.findIndex(
      o => o.output_type === 'execute_result'
    );

    if (executeResultOutputIdx === -1) return;

    const output = this.model.outputs.get(executeResultOutputIdx);

    if (output.type !== 'execute_result') return;

    IDEGlobal.cellUpdateStatus.set(this, 'update');

    output.setData({
      data: {
        [VEGALITE_MIMETYPE]: spec as JSONValue
      }
    });
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    args: IOutputAreaModel.ChangedArgs
  ) {
    const { type, newIndex } = args;

    if (type !== 'add') return;
    const output = model.get(newIndex);

    const metadata = output.metadata;

    if (output.type !== 'execute_result' || metadata.cellId) return;

    IDEGlobal.cellUpdateStatus.set(this, 'execute');

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
