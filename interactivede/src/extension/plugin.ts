import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { NotebookManager } from '../notebook';
import { IDEGlobal, LOG } from '../utils';
import { NBWidgetExtension } from './nbExtension';

/**
 * Plugin initializes here
 */
export const plugin: JupyterFrontEndPlugin<void> = {
  id: 'interactivede:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  activate // This is called to activate the plugin
};

function activate(app: JupyterFrontEnd, nbTracker: INotebookTracker) {
  LOG.log('JupyterLab extension interactivede is activated!');
  console.log('JupyterLab extension interactivede is activated!');

  // TODO: add
  nbTracker.currentChanged.connect((_, nb) => {
    if (!nb) return;
    const nbManager = new NotebookManager(nb);
    nbManager.isReady.then(() => {
      IDEGlobal.nbManager = nbManager;
    });
  });

  // Instantiate the widget extension which does the setup
  app.docRegistry.addWidgetExtension('notebook', new NBWidgetExtension());
}
