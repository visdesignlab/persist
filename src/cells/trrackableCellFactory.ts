import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel, StaticNotebook } from '@jupyterlab/notebook';
import { TrrackableCell } from './trrackableCell';

export class TrrackableCellFactory extends NotebookPanel.ContentFactory {
  createCodeCell(
    options: CodeCell.IOptions,
    _parent: StaticNotebook
  ): CodeCell {
    return TrrackableCell.create(options).initializeState();
  }
}
