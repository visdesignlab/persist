import { State, extend, hookstate } from '@hookstate/core';

import { LocalStored, localstored } from '@hookstate/localstored';
import { Subscribable, subscribable } from '@hookstate/subscribable';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { Signal } from '@lumino/signaling';
import { decompressString, getCellStoreEngine } from '../utils/cellStoreEngine';
import {
  stripImmutableClone,
  stripImmutableCloneJSON
} from '../utils/stripImmutableClone';
import { TrrackManager } from '../widgets/trrack/manager';
import { TrrackGraph } from '../widgets/trrack/types';
import { GeneratedRecord } from '../widgets/utils/dataframe';

export type TrrackableCellId = CodeCell['model']['id'];

export const CODE_CELL = 'code-cell';
export const TRRACK_GRAPH = 'trrack_graph';
export const VEGALITE_SPEC = 'vegalite-spec';
export const ACTIVE_CATEGORY = 'active-category';
export const GENERATED_DATAFRAMES = '__GENERATED_DATAFRAMES__';
export const HAS_PERSIST_OUTPUT = '__has_persist_output';

export class TrrackableCell extends CodeCell {
  // Trrack graph
  private __trrackGraph: State<TrrackGraph | null, LocalStored> | null = null;
  private _generatedDataframes: State<GeneratedRecord, Subscribable>;

  _trrackManager: TrrackManager | null = null;

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

    // const savedString = this.model.getMetadata(TRRACK_GRAPH);
    // const savedGraph: TrrackGraph | null = savedString
    //   ? JSON.parse(decompressString(savedString))
    //   : null;
    //
    // this._trrackGraph = hookstate<TrrackGraph | null, LocalStored>(
    //   savedGraph,
    //   localstored({
    //     key: TRRACK_GRAPH,
    //     engine: getCellStoreEngine(this)
    //   })
    // );

    // add id so that it can be extracted
    this.node.dataset.id = this.cell_id;
    // add the code-cell tag
    this.node.dataset.celltype = CODE_CELL;

    const displayPersistNotice = async (
      outputModel: IOutputAreaModel,
      _: unknown
    ) => {
      await this.ready;

      const node = this.node;

      const footer: HTMLDivElement | null =
        node.querySelector('.jp-CellFooter');

      if (outputModel.length !== 0) {
        if (footer) {
          footer.innerHTML = '';
        }

        return;
      }

      if (this.model.getMetadata(TRRACK_GRAPH)) {
        if (footer) {
          footer.style.height = 'auto';
          footer.innerHTML = `
                <div style="height:20px;width:100%;text-align:center">
                This cell is a persist cell. Please run the cell to enable interactive output.
                </div>
                  `;
        }
      }
    };

    this.model.outputs.changed.connect(displayPersistNotice, this);
    displayPersistNotice(this.model.outputs, this);
  }

  private get _trrackGraph() {
    if (this.__trrackGraph === null) {
      const savedString = this.model.getMetadata(TRRACK_GRAPH);
      const savedGraph: TrrackGraph | null = savedString
        ? JSON.parse(decompressString(savedString))
        : null;

      this.__trrackGraph = hookstate<TrrackGraph | null, LocalStored>(
        savedGraph,
        localstored({
          key: TRRACK_GRAPH,
          engine: getCellStoreEngine(this)
        })
      );
    }

    return this.__trrackGraph;
  }

  get trrackManager() {
    if (!this._trrackManager) {
      this._trrackManager = TrrackManager.getInstance(this);
    }
    return this._trrackManager;
  }

  tagAsPersistCell(has = true) {
    this.model.setMetadata(HAS_PERSIST_OUTPUT, has);
  }

  get generatedDataframesState() {
    return this._generatedDataframes;
  }

  get generatedDataframes() {
    return stripImmutableCloneJSON(
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

    Signal.clearData(this);
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
