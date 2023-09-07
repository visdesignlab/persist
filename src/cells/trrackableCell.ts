import { hookstate } from '@hookstate/core';
import { LocalStored, localstored } from '@hookstate/localstored';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { Trrack } from '@trrack/core';
import { TopLevelSpec } from 'vega-lite';
import { getCellStoreEngine } from '../utils/cellStoreEngine';
import { Nullable } from '../utils/nullable';
import {
  Events,
  TrrackActions,
  TrrackGraph,
  TrrackState
} from '../widgets/trrack/manager';

export type TrrackableCellId = CodeCell['model']['id'];

export const CODE_CELL = 'code-cell';
export const TRRACK_GRAPH = 'trrack_graph';
export const VEGALITE_SPEC = 'vegalite-spec';

export class TrrackableCell extends CodeCell {
  // Trrack graph
  private _trrackGraph = hookstate<TrrackGraph | null, LocalStored>(
    null,
    localstored({
      key: TRRACK_GRAPH,
      engine: getCellStoreEngine(this, true),
      initializer: () => {
        return null as any;
      }
    })
  );

  private _vegaLiteSpec = hookstate<TopLevelSpec | null, LocalStored>(
    null,
    localstored({
      key: VEGALITE_SPEC,
      engine: getCellStoreEngine(this, true),
      initializer: () => {
        return null as any;
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

  get vegaliteSpecState() {
    return this._vegaLiteSpec;
  }

  get vegaliteSpec() {
    return structuredClone(this._vegaLiteSpec.get({ noproxy: true }));
  }

  get cell_id() {
    return this.model.id;
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
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
