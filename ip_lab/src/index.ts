import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the ip_lab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ip_lab:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null
  ) => {
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('ip_lab settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for ip_lab.', reason);
        });
    }
  }
};

export default plugin;
