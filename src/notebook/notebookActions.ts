import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import { isTrrackableCell } from '../cells';
import { IDELogger } from '../utils';

export function setNotebookActionListeners(_nb: Notebook) {
  setupCellExecutedListener();
  setupCellExecutionScheduledListener();
}

function setupCellExecutionScheduledListener() {
  NotebookActions.executionScheduled.connect((_, { cell }) => {
    if (isTrrackableCell(cell)) {
      cell.hasExecuted = false;
    }
  });
}

function setupCellExecutedListener() {
  NotebookActions.executed.connect((_, { cell, notebook }) => {
    if (isTrrackableCell(cell))
      IDELogger.log(`Cell ${cell.cellId} executed in notebook ${notebook.id}`);
  });
}
