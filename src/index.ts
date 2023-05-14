import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the interactivede extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'interactivede:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension interactivede is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('interactivede settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for interactivede.', reason);
        });
    }
  }
};

export default plugin;
