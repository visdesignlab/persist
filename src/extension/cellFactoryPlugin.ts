import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { NotebookPanel } from '@jupyterlab/notebook';
import { TrrackableCellFactory } from '../cells';
import { IDELogger } from '../utils';

export const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.ContentFactory> =
  {
    id: 'persist_ext:cell-factory',
    provides: NotebookPanel.IContentFactory,
    requires: [IEditorServices],
    autoStart: true,
    activate: (_, editor: IEditorServices) => {
      IDELogger.log('Jupyterlab extension PersIst is active! - cell-factory');

      const factory = new Cell.ContentFactory({
        editorFactory: editor.factoryService.newInlineEditor
      });

      return new TrrackableCellFactory(factory);
    }
  };
