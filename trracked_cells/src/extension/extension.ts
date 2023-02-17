import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_apod extension.
 */
export const plugin: JupyterFrontEndPlugin<void> = {
  id: 'trracked_cells:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension trracked_cells is activated!');
  }
};
