import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackableCellFactory } from '../cells';
import { IDELogger } from '../utils';

export const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> =
  {
    id: 'interactivede:cell-factory',
    provides: NotebookPanel.IContentFactory,
    autoStart: true,
    activate: () => {
      console.log(
        'Jupyterlab extension interactivede is activated! - cell-factory'
      );
      IDELogger.log(
        'Jupyterlab extension interactivede is activated! - cell-factory'
      );

      return new TrrackableCellFactory();
    }
  };
