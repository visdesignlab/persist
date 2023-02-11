import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { NotebookActions } from '@jupyterlab/notebook';

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
        console.clear();
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
