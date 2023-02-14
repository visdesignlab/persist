import { Cell } from '@jupyterlab/cells';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { isTrrackedCodeCell } from '../trracked-cell/cell';

export function onExecute(
  notebook: Notebook,
  cell: Cell,
  tracker: INotebookTracker
) {
  if (notebook && tracker && isTrrackedCodeCell(cell)) {
    cell.attemptToRenderTrrack();
  }
}
