import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the persist_ext extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'persist_ext:plugin',
  description:
    'PersIst is a JupyterLab extension to enable persistent interactive visualizations in JupyterLab notebooks.',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
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
  }
};

export default plugin;
