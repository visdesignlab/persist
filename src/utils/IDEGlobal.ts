import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackableCell, TrrackableCellId } from '../cells';
import { IDELogger } from './logging';
import { Nullable } from './nullable';

// eslint-disable-next-line @typescript-eslint/naming-convention
export class IDEGlobal {
  static cells: Map<TrrackableCellId, TrrackableCell> = new Map();

  static Logger: IDELogger;

  static currentNotebook: Nullable<NotebookPanel>;

  static async saveNotebook() {
    if (IDEGlobal.currentNotebook) {
      // await IDEGlobal.currentNotebook.context.save();
    }
    return Promise.resolve();
  }
}

(window as any).IDEGlobal = IDEGlobal;
