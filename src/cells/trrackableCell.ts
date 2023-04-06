import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE4_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { JSONValue } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { TrrackManager } from '../trrack';
import { Nullable } from '../types';
import { Disposable, FlavoredId, IDEGlobal, IDELogger } from '../utils';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

export function isTrrackableCell(cell: Cell): cell is TrrackableCell {
  return cell instanceof TrrackableCell;
}

export class TrrackableCell extends CodeCell {
  private _trrackManager: TrrackManager;
  private _hasExecuted = false;
  private _contentManager: TrrackableCell.ContentManager;

  constructor(
    options: CodeCell.IOptions,
    contentManagerCreator: TrrackableCell.ContentManagerCreator
  ) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager
    this._contentManager = contentManagerCreator(this);

    IDEGlobal.cells.set(this.cellId, this);

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
    this._contentManager.dispose();
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

  get contentManager() {
    return this._contentManager;
  }

  get hasExecuted() {
    return this._hasExecuted;
  }

  set hasExecuted(value: boolean) {
    this._hasExecuted = value;
  }

  get executionSpec() {
    return this.model.metadata.get(
      TRRACK_EXECUTION_SPEC
    ) as Nullable<JSONValue>;
  }

  addSpecToMetadata(spec: Nullable<any>) {
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
        [VEGALITE4_MIME_TYPE]: spec
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

    const metadata = output.metadata;

    if (output.type === 'execute_result' && !metadata.cellId) {
      output.setData({
        metadata: {
          cellId: this.cellId
        }
      });
    }
  }
}

export namespace TrrackableCell {
  export abstract class ContentManager extends Disposable {
    protected _cell: TrrackableCell;

    constructor(cell: TrrackableCell) {
      super();
      this._cell = cell;
      this._registerGlobally();
    }

    abstract _registerGlobally(): void;
  }

  export type ContentManagerCreator<
    T extends TrrackableCell.ContentManager = TrrackableCell.ContentManager
  > = (cell: TrrackableCell) => T;
}
