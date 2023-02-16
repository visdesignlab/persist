import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel, StaticNotebook } from '@jupyterlab/notebook';
import { IOutputPrompt, OutputPrompt } from '@jupyterlab/outputarea';
import { TrrackedCodeCell } from '../trracked-cell/cell';
import { HTML2RendererFactory } from './rendered';
import { TrrackedOutputPrompt } from './TrrackedOutputPrompt';

export class TrrackedCodeCellContentFactory extends NotebookPanel.ContentFactory {
  createOutputPrompt(): IOutputPrompt {
    if (HTML2RendererFactory) return new TrrackedOutputPrompt();
    return new OutputPrompt();
  }

  createCodeCell(options: CodeCell.IOptions, parent: StaticNotebook): CodeCell {
    if (!options.contentFactory) {
      options.contentFactory = this;
    }

    return new TrrackedCodeCell(options).initializeState();
  }
}
