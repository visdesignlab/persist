import { TrrackableCell, TrrackableCellId } from '../cells';
import { PersistCommandRegistry } from '../commands';
import { NotebookWrapper } from '../notebook';
import { Notification as N } from '@jupyterlab/apputils';

declare global {
  // eslint-disable-next-line
  interface Window {
    Persist: PersistObject;
  }
}

type PersistObject = {
  CellMap: Map<TrrackableCellId, TrrackableCell>;
  Commands: PersistCommandRegistry;
  Notebook: NotebookWrapper;
  Notification: {
    notify: typeof N.emit;
  };
};

/**
 * The function `setupPersist` initializes the `Persist` object with a `CellMap`, `Commands`, and
 * `Notebook` property.
 */
export function setupPersist() {
  window.Persist = {
    CellMap: new Map(),
    Commands: new PersistCommandRegistry(),
    Notebook: new NotebookWrapper(),
    Notification: {
      notify(...args: Parameters<typeof N.emit>) {
        return N.emit(...args);
      }
    }
  };
}
