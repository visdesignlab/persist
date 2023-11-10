import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';
import { Nullable } from '../utils/nullable';
import { UUID } from '../utils/uuid';
import { ICellModel } from '@jupyterlab/cells';

const NOTEBOOK_UUID = '__persist_nb_uuid__';
const PERSIST_KEYS_RECORD = '__persist_keys_record';

export const DELETE_NB_METADATA = Symbol('__delete_nb_metadata');

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
        this.udpatePersistKeyRecord(NOTEBOOK_UUID);
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

  forEachCell(fn: (cell: ICellModel) => void) {
    const cells = this.model?.cells;
    if (!cells) {
      return;
    }
    for (let i = 0; i < cells.length; ++i) {
      const cell = cells.get(i);
      fn(cell);
    }
  }

  udpatePersistKeyRecord(key: string | string[], overwrite = false) {
    const persistKeys = this.metadata.get<string[]>(PERSIST_KEYS_RECORD) || [];

    if (overwrite) {
      persistKeys.splice(0, persistKeys.length);
    }

    const keys = (typeof key === 'string' ? [key] : key).filter(
      k => !persistKeys.includes(k)
    );

    persistKeys.push(...keys);

    if (persistKeys.length > 0) {
      this.metadata.write(PERSIST_KEYS_RECORD, [...new Set(persistKeys)]);
    }
  }

  getPersistKeyRecord(): string[] {
    return this.metadata.get<string[]>(PERSIST_KEYS_RECORD) || [];
  }

  get metadata() {
    const model = this.model;

    function get<T>(key: string) {
      return model?.getMetadata(key) as Nullable<T>;
    }

    function write<T = unknown>(
      key: string,
      value: T | null | typeof DELETE_NB_METADATA
    ) {
      if (value === DELETE_NB_METADATA) {
        model?.deleteMetadata(key);
      } else {
        model?.setMetadata(key, value);
      }
    }

    return {
      get,
      write
    };
  }

  save(saveAs = false) {
    if (saveAs) {
      return this._nbPanel?.context.saveAs();
    } else {
      return this._nbPanel?.context.save();
    }
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
