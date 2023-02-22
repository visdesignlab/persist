import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import LOG from '../logging';

class NBWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  createNew(nb: NotebookPanel, ctx: DocumentRegistry.IContext<INotebookModel>) {
    console.log({ nb, ctx });
  }
}

/**
 * Initialization data for the interactivede extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'interactivede:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    LOG.log('JupyterLab extension interactivede is activated!');
    console.log('JupyterLab extension interactivede is activated!');
    app.docRegistry.addWidgetExtension('notebook', new NBWidgetExtension());
    const a: any = app.docRegistry;
    console.log(a._extenders);
  }
};

export default [plugin];
