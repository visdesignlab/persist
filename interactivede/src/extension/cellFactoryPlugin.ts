import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackableCellFactory } from '../cells/trrackableCellFactory';
import LOG from '../utils/logging';

export const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> =
  {
    id: 'interactivede:cell-factory',
    provides: NotebookPanel.IContentFactory,
    autoStart: true,
    activate: () => {
      console.log(
        'Jupyterlab extension interactivede is activated! - cell-factory'
      );
      LOG.log(
        'Jupyterlab extension interactivede is activated! - cell-factory'
      );
      return new TrrackableCellFactory();
    }
  };
