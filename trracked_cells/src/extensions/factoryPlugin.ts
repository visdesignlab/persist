import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackedCellFactory } from '../factories/trrackedCellFactory';

export const factory: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> = {
  id: 'trracked_cells:factory',
  provides: NotebookPanel.IContentFactory,
  autoStart: true,
  activate: () => {
    console.log('Jupyterlab extension trracked_cells is activated! - factory');
    return new TrrackedCellFactory();
  }
};
