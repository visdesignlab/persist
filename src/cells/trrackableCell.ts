import { hookstate } from '@hookstate/core';
import { LocalStored, localstored } from '@hookstate/localstored';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { Trrack } from '@trrack/core';
import { getCellStoreEngine } from '../utils/cellStoreEngine';
import { Nullable } from '../utils/nullable';
import { Events, TrrackActions, TrrackState } from '../widgets/trrack/manager';

export type TrrackableCellId = CodeCell['model']['id'];

export const CODE_CELL = 'code-cell';
export const TRRACK_GRAPH = 'trrack_graph';

export class TrrackableCell extends CodeCell {
  // Trrack graph
  private _trrackGraph = hookstate<Nullable<string>, LocalStored>(
    null,
    localstored({
      key: TRRACK_GRAPH,
      engine: getCellStoreEngine(this),
      initializer: () => {
        const graph = this.model.getMetadata(TRRACK_GRAPH) || null;
        return Promise.resolve(graph);
      }
    })
  );

  trrack: Nullable<Trrack<TrrackState, Events>> = null;
  trrackActions: Nullable<TrrackActions> = null;

  constructor(opts: CodeCell.IOptions) {
    super(opts);

    if (!window.Persist.CellMap) {
      throw new Error('Entry point not executed');
    }

    window.Persist.CellMap.set(this.cell_id, this);

    // add id so that it can be extracted
    this.node.dataset.id = this.cell_id;
    // add the code-cell tag
    this.node.dataset.celltype = CODE_CELL;

    this.model.outputs.changed.connect(() => {
      // Show error message here
    });
  }

  get trrackGraphState() {
    return this._trrackGraph;
  }

  get trrackGraph() {
    return structuredClone(this._trrackGraph.get({ noproxy: true }));
  }

  get cell_id() {
    return this.model.id;
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
    console.log('Cleaning up', this);
    window.Persist.CellMap.delete(this.cell_id);

    super.dispose();
  }
}

export namespace TrrackableCell {
  export function create(options: CodeCell.IOptions) {
    return new TrrackableCell(options);
  }

  export function isTrrackableCell(cell: Cell): cell is TrrackableCell {
    return cell instanceof TrrackableCell;
  }
}
