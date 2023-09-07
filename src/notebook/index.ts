import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';
import { Nullable } from '../utils/nullable';
import { UUID } from '../utils/uuid';

const NOTEBOOK_UUID = '__persist_nb_uuid__';

export class NotebookWrapper {
  private _nb: Nullable<Notebook>;

  private _setupFinishDelegate = new PromiseDelegate<void>();

  constructor(private _nbPanel: Nullable<NotebookPanel> = null) {
    this._nb = _nbPanel?.content;

    this._nbPanel?.context.ready
      .then(() => {
        return onContextReady(this);
      })
      .then(() => {
        this._setupFinishDelegate.resolve();
      });
  }

  get nb() {
    return this._nb;
  }

  get nbPanel() {
    return this._nbPanel;
  }

  get model() {
    return this._nbPanel?.model;
  }

  get setupFinish() {
    return this._setupFinishDelegate.promise;
  }

  get nbUid() {
    return this.model?.getMetadata(NOTEBOOK_UUID) as string;
  }

  save() {
    return this._nbPanel?.context.save();
  }
}

async function onContextReady(nb: NotebookWrapper) {
  await saveUUID(nb);

  return Promise.resolve();
}

async function saveUUID(nb: NotebookWrapper) {
  if (nb.model) {
    const hasUid = !!nb.nbUid;
    if (!hasUid) {
      nb.model.setMetadata(NOTEBOOK_UUID, UUID());
      await nb.save();
    }
  }
  return Promise.resolve();
}
