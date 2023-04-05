import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel, StaticNotebook } from '@jupyterlab/notebook';
import { VegaManager } from './trrack/vega';
import { TrrackableCell } from './trrackableCell';

export class TrrackableCellFactory extends NotebookPanel.ContentFactory {
  createCodeCell(
    options: CodeCell.IOptions,
    _parent: StaticNotebook
  ): CodeCell {
    return new TrrackableCell(
      options,
      (cell: TrrackableCell) => new VegaManager(cell)
    ).initializeState();
  }
}
