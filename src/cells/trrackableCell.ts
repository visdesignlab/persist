import { State, hookstate } from '@hookstate/core';
import { LocalStored, localstored } from '@hookstate/localstored';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { TopLevelSpec } from 'vega-lite';
import { decompressString, getCellStoreEngine } from '../utils/cellStoreEngine';
import { TrrackManager } from '../widgets/trrack/manager';
import { stripImmutableClone } from '../utils/stripImmutableClone';
import { TrrackGraph } from '../widgets/trrack/types';

export type TrrackableCellId = CodeCell['model']['id'];

export const CODE_CELL = 'code-cell';
export const TRRACK_GRAPH = 'trrack_graph';
export const VEGALITE_SPEC = 'vegalite-spec';

export class TrrackableCell extends CodeCell {
  // Trrack graph
  private _trrackGraph: State<TrrackGraph | null, LocalStored>;

  private _vegaLiteSpec = hookstate<TopLevelSpec | null, LocalStored>(
    null,
    localstored({
      key: VEGALITE_SPEC,
      engine: getCellStoreEngine(this),
      initializer: () => {
        return Promise.resolve(this.model.getMetadata(VEGALITE_SPEC) || null);
      }
    })
  );

  trrackManager: TrrackManager;

  constructor(opts: CodeCell.IOptions) {
    super(opts);

    if (!window.Persist.CellMap) {
      throw new Error('Entry point not executed');
    }
    window.Persist.CellMap.set(this.cell_id, this);

    const savedString = this.model.getMetadata(TRRACK_GRAPH);
    const savedGraph: TrrackGraph | null = savedString
      ? JSON.parse(decompressString(savedString))
      : null;

    this._trrackGraph = hookstate<TrrackGraph | null, LocalStored>(
      savedGraph,
      localstored({
        key: TRRACK_GRAPH,
        engine: getCellStoreEngine(this),
        initializer: () => {
          const t = this.model.getMetadata(TRRACK_GRAPH);
          console.log('Init', t);
          return Promise.resolve(t || null);
        }
      })
    );

    console.log('accessing', this.trrackGraph);
    console.log(this.model.getMetadata(TRRACK_GRAPH));
    this.trrackManager = TrrackManager.getInstance(this);
    // add id so that it can be extracted
    this.node.dataset.id = this.cell_id;
    // add the code-cell tag
    this.node.dataset.celltype = CODE_CELL;
  }

  get trrackGraphState() {
    return this._trrackGraph;
  }

  get trrackGraph() {
    return stripImmutableClone(this._trrackGraph.get({ noproxy: true }));
  }

  get vegaliteSpecState() {
    return this._vegaLiteSpec;
  }

  get vegaliteSpec() {
    return stripImmutableClone(this._vegaLiteSpec.get({ noproxy: true }));
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
