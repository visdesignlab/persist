import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { rendererFactory } from '@jupyterlab/vega5-extension';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../constants';
import { RenderedTrrackGraph } from '../renderers/trrackGraphRenderer';
import { RenderedTrrackOutput } from '../renderers/trrackOutputRenderer';
import { RenderedVega2 } from '../renderers/vegaRenderer';
import { IDEGlobal } from '../utils/IDEGlobal';

export class NBWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
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
    IDEGlobal.trracks = new Map();
    IDEGlobal.views = new Map();
    IDEGlobal.cells = new Map();
    IDEGlobal.renderMimeRegistry = nb.content.rendermime;
  }
}
