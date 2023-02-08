import { Cell } from '@jupyterlab/cells';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';

export function onExecute(
  notebook: Notebook,
  cell: Cell,
  tracker: INotebookTracker
) {
  console.log({ notebook, cell, tracker });
}
