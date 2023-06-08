import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  INotebookModel,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import { rendererFactory as vegaRendererFactory } from '@jupyterlab/vega5-extension';
import { UUID } from '@lumino/coreutils';
import { Executor } from '../../notebook';
import { setNotebookActionListeners } from '../../notebook/notebookActions';
import { IDEGlobal, IDELogger, Nullable } from '../../utils';
import { RenderedTrrackVegaOutput } from '../../vegaL/renderer';

export const NB_UUID = 'NB_UUID';

export class NBWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(nbTracker: INotebookTracker) {
    Executor.init(nbTracker);

    nbTracker.currentChanged.connect((_, nb) => {
      if (nb) IDELogger.log(`Switched to notebook: ${nb?.context.path}`);

      nb?.context.ready.then(() => {
        const uid = nb.context.model.getMetadata(NB_UUID) as Nullable<string>;
        if (!uid) {
          const uuid = UUID.uuid4();
          nb.context.model.setMetadata(NB_UUID, uuid);
          IDEGlobal.currentNotebook = uuid;
        } else {
          IDEGlobal.currentNotebook = uid;
        }
      });

      nb?.disposed.connect(() => {
        IDELogger.log(`Closed notebook: ${nb?.context.path}`);
      });
    });
  }

  // Called automatically. Do setup here
  createNew(
    nb: NotebookPanel,
    _ctx: DocumentRegistry.IContext<INotebookModel>
  ) {
    // Add a new renderer for vega. Which wraps the original renderer and adds
    // adds header & trrack-vis areas to output
    nb.content.rendermime.addFactory({
      ...vegaRendererFactory,
      defaultRank: (vegaRendererFactory.defaultRank || 10) - 1,
      createRenderer: options => new RenderedTrrackVegaOutput(options)
    });

    // Init global variables
    setNotebookActionListeners(nb.content);
  }
}
