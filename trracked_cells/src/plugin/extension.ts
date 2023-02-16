import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISessionContext } from '@jupyterlab/apputils';
import {
  INotebookModel,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';
import { OutputArea } from '@jupyterlab/outputarea';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { JSONObject } from '@lumino/coreutils';
import { DisposableDelegate } from '@lumino/disposable';

import { IDocumentManager } from '@jupyterlab/docmanager';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookActions } from '@jupyterlab/notebook';
import { IExecuteReplyMsg } from '@jupyterlab/services/lib/kernel/messages';
import { TrrackedCodeCellContentFactory } from '../misc/factory';
import { HTML2RendererFactory } from '../misc/rendered';
import { onExecute } from '../notebook';

export class TrrackContext {
  private static _context: DocumentRegistry.IContext<INotebookModel> | null =
    null;

  static get context() {
    if (!this._context) throw new Error('Context not set');
    return this._context;
  }

  static set context(context: DocumentRegistry.IContext<INotebookModel>) {
    this._context = context;
  }
}

export type INBWidgetExtension = DocumentRegistry.IWidgetExtension<
  NotebookPanel,
  INotebookModel
>;

export class NBWidgetExtension implements INBWidgetExtension {
  createNew(
    nb: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ) {
    nb.content.rendermime.addFactory(HTML2RendererFactory);

    return new DisposableDelegate(() => {
      // console.log('Hello');
    });
  }
}

/**
 * Initialization data for the trracked_cells extension.
 */
export const executor: JupyterFrontEndPlugin<void> = {
  id: 'trracked_cells:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  requires: [INotebookTracker, IDocumentManager],
  activate: (
    app: JupyterFrontEnd,
    nbTracker: INotebookTracker,
    docManager: IDocumentManager,
    settingRegistry: ISettingRegistry | null
  ) => {
    // Render Trrack
    const nbExtension = new NBWidgetExtension();
    app.docRegistry.addWidgetExtension('Notebook', nbExtension);

    nbTracker.currentChanged.connect((a, b) => {
      if (!b) return;
      TrrackContext.context = b.context;
      b.sessionContext.connectionStatusChanged.connect((a, b) => {
        if (b === 'connected') {
          console.log('Trying to exec');
          a.session?.kernel?.requestExecute(
            (function () {
              return {
                code: `
                  import trracked_cells
                  trracked_cells.init()
                `
              };
            })()
          );
        }
      });
    });

    const originalExecuteFn = OutputArea.execute;
    NotebookActions.executionScheduled.connect(
      async (_, { notebook, cell }) => {
        OutputArea.execute = (
          code: string,
          output: OutputArea,
          sessionContext: ISessionContext,
          metadata: JSONObject | undefined = {}
        ) => {
          let promise: Promise<IExecuteReplyMsg | undefined>;

          // metadata['cellular_id'] = cell.model.id;

          try {
            promise = originalExecuteFn(code, output, sessionContext, metadata);
          } finally {
            OutputArea.execute = originalExecuteFn;
          }

          return promise;
        };
      }
    );

    NotebookActions.executed.connect((_, { notebook, cell, success }) => {
      if (success) {
        onExecute(notebook, cell, nbTracker);
      }
    });

    if (settingRegistry) {
      settingRegistry
        .load(executor.id)
        .then(settings => {
          console.log('trracked_cells settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for trracked_cells.', reason);
        });
    }
  }
};

export const factory: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> = {
  id: 'trracked_cells:factory',
  provides: NotebookPanel.IContentFactory,
  autoStart: true,
  activate: () => {
    return new TrrackedCodeCellContentFactory();
  }
};
