import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE5_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { Signal } from '@lumino/signaling';
import { FlavoredId } from '@trrack/core';
import { TrrackManager } from '../trrack';
import { IDEGlobal, IDELogger } from '../utils';
import { Spec } from '../vegaL/spec';
import * as d3 from 'd3';

export const VEGALITE_MIMETYPE = VEGALITE5_MIME_TYPE;

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';

export class TrrackableCell extends CodeCell {
  private _trrackManager: TrrackManager;
  warnings: string[] = [];
  categories: string[] = [];
  categoryColorScale: d3.ScaleOrdinal<string, string>;

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.categories = [];
    this.categoryColorScale = d3.scaleOrdinal(d3.schemeCategory10);
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

  get executionSpec(): Spec | null {
    return this.model.getMetadata(TRRACK_EXECUTION_SPEC) as Spec | null;
  }

  addCategory(cat: string) {
    this.categories = [...this.categories, cat];
    this.categoryColorScale.domain(this.categories);
  }

  removeCategory(cat: string) {
    this.categories = this.categories.filter(c => c !== cat);
    this.categoryColorScale.domain(this.categories);
  }

  addSpecToMetadata(spec: Spec) {
    const isExecute = IDEGlobal.cellUpdateStatus.get(this) === 'execute';

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

    IDEGlobal.cellUpdateStatus.set(this, 'update');

    output.setData({
      data: {
        [VEGALITE_MIMETYPE]: spec as any
      }
    });
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
