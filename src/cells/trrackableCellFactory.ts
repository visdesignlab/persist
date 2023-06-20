import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackableCell } from './trrackableCell';

export class TrrackableCellFactory extends NotebookPanel.ContentFactory {
  createCodeCell(options: CodeCell.IOptions): CodeCell {
    return TrrackableCell.create(options).initializeState();
  }
}
