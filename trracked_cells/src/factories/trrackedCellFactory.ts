import { CodeCell, IInputPrompt } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackedCell } from '../cells/trrackedCell';
import { TrrackedInputPrompt } from '../cells/trrackedInputPrompt';

export class TrrackedCellFactory extends NotebookPanel.ContentFactory {
  createInputPrompt(): IInputPrompt {
    return new TrrackedInputPrompt();
  }

  createCodeCell(options: CodeCell.IOptions) {
    if (!options.contentFactory) {
      options.contentFactory = this;
    }
    return new TrrackedCell(options).initializeState();
  }
}
