import { Notebook, NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import LOG from '../utils/logging';
import { Executor } from './kernel/exec';

export type NBEvents =
  | 'cell-update'
  | 'active-cell-change'
  | 'cell-run'
  | 'name-change'
  | 'path-change';

export class NotebookManager {
  nbPanel: NotebookPanel;
  private _nbEvent = new Signal<this, NBEvents>(this);
  private _isReady: PromiseDelegate<void> = new PromiseDelegate();
  private _exec: Executor;

  constructor(nb: NotebookPanel) {
    this.nbPanel = nb;

    this.sessionListener();
    this._exec = new Executor(nb);

    this.nbPanel.revealed.then(() => {
      this.addNotebookEventListeners();
      this._isReady.resolve();
    });

    LOG.log(`Notebook ${nb.content.id} connected to manager`);
  }

  get executor() {
    return this._exec;
  }

  get isReady() {
    return this._isReady.promise;
  }

  get cells() {
    return this.notebook.model?.cells || [];
  }

  get notebook(): Notebook {
    return this.nbPanel.content;
  }

  get id() {
    return this.notebook.id;
  }

  addNotebookEventListeners() {
    this.load();

    this.notebook.model?.cells.changed.connect(() => {
      this.load();
      this._nbEvent.emit('cell-update');
    });

    this.notebook.activeCellChanged.connect(() => {
      this._nbEvent.emit('active-cell-change');
    });

    NotebookActions.executed.connect((_, changed) => {
      if (this.notebook.id === changed.notebook.id) {
        this._nbEvent.emit('cell-run');
      }
    });
  }

  private sessionListener() {
    this.nbPanel.sessionContext.propertyChanged.connect((_, changedProp) => {
      if (changedProp === 'name') {
        this._nbEvent.emit('name-change');
      }

      if (changedProp === 'path') {
        this._nbEvent.emit('path-change');
      }
    });
  }

  load() {
    console.log('Load all cells');
  }
}
