import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  INotebookModel,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import { rendererFactory as vegaRendererFactory } from '@jupyterlab/vega5-extension';
import { Executor } from '../../notebook';
import { IDEGlobal } from '../../utils';
import { RenderedSidebarVegaOutput } from '../../vegaL/renderer';

export const NB_UUID = 'NB_UUID';

export class NBWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(nbTracker: INotebookTracker) {
    Executor.init(nbTracker);

    nbTracker.currentChanged.connect((_, nbPanel) => {
      IDEGlobal.currentNotebook = nbPanel;
      if (nbPanel) {
        nbPanel.context.ready.then(() => {
          //
        });
      }
    });
  }

  // This is called when notebook is opened. Executed only once AFAIK
  createNew(
    nb: NotebookPanel,
    _ctx: DocumentRegistry.IContext<INotebookModel>
  ) {
    // Add a new renderer for vega. Which wraps the original renderer and adds
    // adds header & trrack-vis areas to output
    nb.content.rendermime.addFactory({
      ...vegaRendererFactory,
      defaultRank: (vegaRendererFactory.defaultRank || 10) - 1,
      createRenderer: options => new RenderedSidebarVegaOutput(options)
    });
  }
}
