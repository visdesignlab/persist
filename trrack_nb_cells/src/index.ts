import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the trrack-nb-cells extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'trrack-nb-cells:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension trrack-nb-cells is activated!');
    console.log('Seems to work!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('trrack-nb-cells settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for trrack-nb-cells.', reason);
        });
    }
  }
};

export default plugin;
