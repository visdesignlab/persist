import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel, StaticNotebook } from '@jupyterlab/notebook';
import { TrrackedCodeCell } from './cell';
import { HTML2RendererFactory } from './rendered';

export class TrrackedCodeCellContentFactory extends NotebookPanel.ContentFactory {
  createCodeCell(options: CodeCell.IOptions, parent: StaticNotebook): CodeCell {
    if (!options.contentFactory) {
      options.contentFactory = this;
    }

    options.rendermime.addFactory(HTML2RendererFactory);

    return new TrrackedCodeCell(options).initializeState();
  }
}
