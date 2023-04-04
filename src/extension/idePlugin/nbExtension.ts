import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  INotebookModel,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';
import { rendererFactory } from '@jupyterlab/vega5-extension';

import { UUID } from '@lumino/coreutils';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../../constants';
import { setNotebookActionListeners } from '../../notebook/notebookActions';
import {
  RenderedTrrackGraph,
  RenderedTrrackOutput,
  RenderedVega2
} from '../../renderers';
import { Nullable } from '../../types';
import { IDEGlobal, IDELogger } from '../../utils';

export const NB_UUID = 'NB_UUID';

export class NBWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(nbTracker: INotebookTracker) {
    IDEGlobal.executor.init(nbTracker);

    nbTracker.currentChanged.connect((_, nb) => {
      if (nb) IDELogger.log(`Switched to notebook: ${nb?.context.path}`);

      nb?.context.ready.then(() => {
        const uid = nb.context.model.metadata.get(NB_UUID) as Nullable<string>;
        if (!uid) {
          const uuid = UUID.uuid4();
          nb.context.model.metadata.set(NB_UUID, uuid);
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
    // Add a new renderer for vega. Which wraps the original renderer
    nb.content.rendermime.addFactory({
      ...rendererFactory,
      defaultRank: (rendererFactory.defaultRank || 10) - 1,
      createRenderer: options => new RenderedVega2(options)
    });

    // Add a renderer for a new mime type called trrack which just wraps cell execution result with trrackId
    nb.content.rendermime.addFactory({
      safe: true,
      mimeTypes: [TRRACK_MIME_TYPE],
      defaultRank: 10,
      createRenderer: options => new RenderedTrrackOutput(options)
    });

    // Add a renderer for a new mime type called trrack-graph which which renders a trrack graph from trrackId
    nb.content.rendermime.addFactory({
      safe: true,
      mimeTypes: [TRRACK_GRAPH_MIME_TYPE],
      defaultRank: 10,
      createRenderer: options => new RenderedTrrackGraph(options)
    });

    // Init global variables
    IDEGlobal.renderMimeRegistry = nb.content.rendermime;
    setNotebookActionListeners(nb.content);
  }
}
