import { NotebookPanel } from '@jupyterlab/notebook';

export function getNotebookId(nb: NotebookPanel) {
  return nb.content.id;
}
