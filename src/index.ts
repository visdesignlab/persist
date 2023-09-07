import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TrrackableCellFactory } from './cells';
import { NotebookWrapper } from './notebook';
import { setupPersist } from './utils/globals';

/**
 * Initialization data for the persist_ext extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'persist_ext:plugin',
  description:
    'PersIst is a JupyterLab extension to enable persistent interactive visualizations in JupyterLab notebooks.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ISettingRegistry],
  activate: (
    _app: JupyterFrontEnd,
    nbTracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null
  ) => {
    // Setup window.Persist
    setupPersist();

    // Listen to notebook changes
    nbTracker.currentChanged.connect((_, nbPanel) => {
      const wrapper = new NotebookWrapper(nbPanel);
      window.Persist.Notebook = wrapper;

      wrapper.setupFinish.then(() => {
        console.log(wrapper.nbUid, 'is ready!');
      });
    });

    console.log('JupyterLab extension persist_ext is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('persist_ext settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for persist_ext.', reason);
        });
    }
  }
};

const trrackableCellPlugin: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> =
  {
    id: 'persist_ext:trrackable-cell-plugin',
    description: 'Trrackable cell plugin companion',
    autoStart: true,
    provides: NotebookPanel.IContentFactory,
    requires: [IEditorServices],
    activate: (_app: JupyterFrontEnd, editor: IEditorServices) => {
      console.log('JupyterLab extension trrackable-persist-cell is activated!');

      const factory = new Cell.ContentFactory({
        editorFactory: editor.factoryService.newInlineEditor
      });

      return new TrrackableCellFactory(factory);
    }
  };

export default [plugin, trrackableCellPlugin];
