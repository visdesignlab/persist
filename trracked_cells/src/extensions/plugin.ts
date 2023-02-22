import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISessionContext } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  INotebookModel,
  Notebook,
  NotebookActions,
  NotebookPanel
} from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Kernel } from '@jupyterlab/services';
import { NodeId } from '@trrack/core';
import { TrrackedCell } from '../cells/trrackedCell';
import { Comm } from '../comms/manager';
import {
  TRRACK_GRAPH_MIME_TYPE,
  TRRACK_MIME_TYPE
} from '../renderers/mimetypes';
import { RenderedTrrackGraph } from '../renderers/trrackGraphRenderer';
import { RenderedTrrack } from '../renderers/trrackRenderer';
import { TrrackManager } from '../trrack/manager';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export interface Window {
    renderMimeRegistry: IRenderMimeRegistry;
    trrackMap: Map<NodeId, TrrackManager>;
    comms: Map<string, Comm>;
  }
}

class NBWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  createNew(
    nb: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ) {
    nb.content.rendermime.addFactory({
      safe: true,
      mimeTypes: [TRRACK_MIME_TYPE],
      createRenderer: options => new RenderedTrrack(options)
    });

    nb.content.rendermime.addFactory({
      safe: true,
      mimeTypes: [TRRACK_GRAPH_MIME_TYPE],
      createRenderer: options => new RenderedTrrackGraph(options)
    });

    setupCellExecute(context.sessionContext);

    window.renderMimeRegistry = nb.content.rendermime;
    window.trrackMap = new Map();
    window.comms = new Map();
  }
}

/**
 * Initialization data for the jupyterlab_apod extension.
 */
export const plugin: JupyterFrontEndPlugin<void> = {
  id: 'trracked_cells:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension trracked_cells is activated!');
    app.docRegistry.addWidgetExtension('Notebook', new NBWidgetExtension());
  }
};

async function setupCellExecute(ctx: ISessionContext) {
  await ctx.ready;

  ctx.connectionStatusChanged.connect((ctx, status) => {
    console.log(status);
    if (status !== 'connected') {
      return;
    }

    const kernel = ctx.session?.kernel;

    if (!kernel) return;

    NotebookActions.executed.connect(
      (_, { notebook, cell, success, error }) => {
        if (!kernel) return;
        if (!success || error) {
          if (error) throw error;
          else throw new Error('Something went wrong!');
        }

        if (TrrackedCell.isTrrackedCell(cell)) {
          checkCellComm(kernel, { notebook, cell });
        }
      }
    );
  });
}

function checkCellComm(
  kernel: Kernel.IKernelConnection,
  {
    notebook,
    cell
  }: {
    notebook: Notebook;
    cell: TrrackedCell;
  }
) {
  kernel.connectionStatusChanged.connect(cell.monitorKernelStatus, cell);
  cell.setupComms(kernel);
}
