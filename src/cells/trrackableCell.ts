import { State, extend, hookstate } from '@hookstate/core';

import { LocalStored, localstored } from '@hookstate/localstored';
import { subscribable, Subscribable } from '@hookstate/subscribable';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { decompressString, getCellStoreEngine } from '../utils/cellStoreEngine';
import { TrrackManager } from '../widgets/trrack/manager';
import { stripImmutableClone } from '../utils/stripImmutableClone';
import { TrrackGraph } from '../widgets/trrack/types';
import { GeneratedRecord } from '../widgets/utils/dataframe';

export type TrrackableCellId = CodeCell['model']['id'];

export const CODE_CELL = 'code-cell';
export const TRRACK_GRAPH = 'trrack_graph';
export const VEGALITE_SPEC = 'vegalite-spec';
export const ACTIVE_CATEGORY = 'active-category';
export const GENERATED_DATAFRAMES = '__GENERATED_DATAFRAMES__';

export class TrrackableCell extends CodeCell {
  // Trrack graph
  private _trrackGraph: State<TrrackGraph | null, LocalStored>;
  private _generatedDataframes: State<GeneratedRecord, Subscribable>;

  trrackManager: TrrackManager;

  constructor(opts: CodeCell.IOptions) {
    super(opts);

    if (!window.Persist.CellMap) {
      throw new Error('Entry point not executed');
    }
    window.Persist.CellMap.set(this.cell_id, this);

    const savedGenRecordString = this.model.getMetadata(GENERATED_DATAFRAMES);
    const savedGenRecord: any = {};
    savedGenRecordString
      ? JSON.parse(decompressString(savedGenRecordString))
      : null;

    this._generatedDataframes = hookstate<GeneratedRecord, Subscribable>(
      savedGenRecord,
      extend(
        subscribable(),
        localstored({
          key: GENERATED_DATAFRAMES,
          engine: getCellStoreEngine(this)
        })
      )
    );

    const savedString = this.model.getMetadata(TRRACK_GRAPH);
    const savedGraph: TrrackGraph | null = savedString
      ? JSON.parse(decompressString(savedString))
      : null;

    this._trrackGraph = hookstate<TrrackGraph | null, LocalStored>(
      savedGraph,
      localstored({
        key: TRRACK_GRAPH,
        engine: getCellStoreEngine(this)
      })
    );

    this.trrackManager = TrrackManager.getInstance(this);
    // add id so that it can be extracted
    this.node.dataset.id = this.cell_id;
    // add the code-cell tag
    this.node.dataset.celltype = CODE_CELL;
  }

  get generatedDataframesState() {
    return this._generatedDataframes;
  }

  get generatedDataframes() {
    return stripImmutableClone(
      this._generatedDataframes.get({ noproxy: true })
    );
  }

  get trrackGraphState() {
    return this._trrackGraph;
  }

  get trrackGraph() {
    return stripImmutableClone(this._trrackGraph.get({ noproxy: true }));
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
