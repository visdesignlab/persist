import { TrrackManager } from '../trrack/trrack-manager';
import { TrrackedCodeCell } from './cell';

export class TrrackedCellManager {
  static cellMap: Map<string, TrrackedCellManager> = new Map();

  static get(id: string) {
    const manager = TrrackedCellManager.cellMap.get(id);
    if (manager) return manager;
    throw new Error(`No TrrackedCellManager found for id ${id}`);
  }

  static processSelection(id: string, selection: any) {
    if (!selection) return;
    const cellManager = TrrackedCellManager.get(id);
    cellManager._cell.manager.trrackManager.trrack?.apply(
      'Selection',
      cellManager._cell.manager.trrackManager.actions.selectionAction(selection)
    );
  }

  constructor(private _cell: TrrackedCodeCell) {
    this._trrackManager = new TrrackManager(this);

    if (this._cellModel.outputs.length > 0) {
      this._trrackManager.init();
    }

    this._cellModel.outputs.changed.connect((a, b) => {
      if (!b) console.log(a, b);
    });

    TrrackedCellManager.cellMap.set(this._cellModel.id, this);
  }

  // Private Properties
  private _trrackManager: TrrackManager;

  // Private Accessors
  private get _cellModel() {
    return this._cell.model;
  }

  // Public Accessors
  get savedGraph() {
    return this._cellModel.metadata.get('trrack') as string | undefined;
  }

  get trrackManager() {
    return this._trrackManager;
  }
}
