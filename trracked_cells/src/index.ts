import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISessionContext } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { OutputArea } from '@jupyterlab/outputarea';
import { IExecuteReplyMsg } from '@jupyterlab/services/lib/kernel/messages';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { JSONObject } from '@lumino/coreutils';

import { NotebookActions } from '@jupyterlab/notebook';

import { registerComms } from './comms/register';
import { TrrackedCodeCellContentFactory } from './factory';
import { requestAPI } from './handler';
import { onExecute } from './notebook';

/**
 * Initialization data for the trracked_cells extension.
 */
const executor: JupyterFrontEndPlugin<void> = {
  id: 'trracked_cells:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  requires: [INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    nbTracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null
  ) => {
    nbTracker.currentChanged.connect((a, b) => {
      if (!b) return;
      registerComms(b);
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

          metadata['cell_id'] = cell.model.id;

          code = `from trracked_cells import run_before\nrun_before("${cell.model.id}")\n${code}`;

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

    requestAPI<any>('get_example')
      .then(data => {
        console.log({ data });
      })
      .catch(reason => {
        console.error(
          `The trracked_cells server extension appears to be missing.\n${reason}`
        );
      });
  }
};

const factory: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> = {
  id: 'trracked_cells:factory',
  provides: NotebookPanel.IContentFactory,
  autoStart: true,
  activate: () => {
    return new TrrackedCodeCellContentFactory();
  }
};

export default [executor, factory];
