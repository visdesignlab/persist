import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { IComm } from '@jupyterlab/services/lib/kernel/kernel';
import { TrrackContext } from './plugin';

export class CellCommManager {
  _ctx: DocumentRegistry.IContext<INotebookModel>;
  _comm: IComm | null = null;

  constructor(public _id: string) {
    this._ctx = TrrackContext.context;
  }
}
