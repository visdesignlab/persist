import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, IFrame } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { ILauncher } from '@jupyterlab/launcher';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestApi } from './server-extension/handler';

namespace CommandIds {
  export const get = 'server:get-file';
}

/**
 * Initialization data for the ip_lab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ip_lab:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher, ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    launcher: ILauncher | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    try {
      const data = await requestApi<any>('hello');
      console.log(data);
    } catch (reason) {
      console.error(`Error on GET\n${reason}`);
    }

    const dataToSend = { name: 'Kiran' };
    try {
      const reply = await requestApi<any>('hello', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      console.log(reply);
    } catch (reason) {
      console.error(`Error on POST\n${reason}`);
    }

    const { commands, shell } = app;

    const command = CommandIds.get;

    const category = 'Extension Examples';

    commands.addCommand(command, {
      label: 'Get server content',
      caption: 'Get server content',
      execute: () => {
        const widget = new IFrameWidget();
        shell.add(widget, 'main');
      }
    });

    palette.addItem({ command, category });

    if (launcher) {
      launcher.add({
        command,
        category
      });
    }

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

class IFrameWidget extends IFrame {
  constructor() {
    super();
    const baseUrl = PageConfig.getBaseUrl();
    this.url = baseUrl + 'ip-lab-ext-example/public/index.html';
    this.id = 'doc-example';
    this.title.label = 'Server';
    this.title.closable = true;
    this.node.style.overflow = 'auto';
  }
}
