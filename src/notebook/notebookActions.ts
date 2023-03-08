import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import { isTrrackableCell } from '../cells';
import { IDELogger } from '../utils';

export function setNotebookActionListeners(_nb: Notebook) {
  setupCellExecuteListener();
}

function setupCellExecuteListener() {
  NotebookActions.executed.connect((_, { cell, notebook }) => {
    if (isTrrackableCell(cell))
      IDELogger.log(`Cell ${cell.cellId} executed in notebook ${notebook.id}`);
  });
}
