import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel, StaticNotebook } from '@jupyterlab/notebook';
import { TrrackedCodeCell } from './cell';

export class TrrackedCodeCellContentFactory extends NotebookPanel.ContentFactory {
  createCodeCell(options: CodeCell.IOptions, parent: StaticNotebook): CodeCell {
    if (!options.contentFactory) {
      options.contentFactory = this;
    }

    console.log('Creating Trracked Code Cell');

    return new TrrackedCodeCell(options).initializeState();
  }
}
