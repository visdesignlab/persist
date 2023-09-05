import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { NotebookActions, NotebookPanel } from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TrrackableCellFactory } from './cells';

/**
 * Initialization data for the persist_ext extension.
 */
const plugin: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> = {
  id: 'persist_ext:plugin',
  description:
    'PersIst is a JupyterLab extension to enable persistent interactive visualizations in JupyterLab notebooks.',
  autoStart: true,
  provides: NotebookPanel.IContentFactory,
  requires: [IEditorServices],
  optional: [ISettingRegistry],
  activate: (
    _app: JupyterFrontEnd,
    editor: IEditorServices,
    settingRegistry: ISettingRegistry | null
  ) => {
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

    NotebookActions;

    const factory = new Cell.ContentFactory({
      editorFactory: editor.factoryService.newInlineEditor
    });

    return new TrrackableCellFactory(factory);
  }
};

export default plugin;
