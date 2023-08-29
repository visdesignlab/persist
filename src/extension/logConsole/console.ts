import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IObservableList } from '@jupyterlab/observables';

import {
  CommandToolbarButton,
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import {
  IHtmlLog,
  IOutputLog,
  ITextLog,
  LogConsolePanel,
  LoggerRegistry
} from '@jupyterlab/logconsole';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import {
  addIcon,
  clearIcon,
  downloadIcon,
  listIcon
} from '@jupyterlab/ui-components';

import * as nbformat from '@jupyterlab/nbformat';

import { Event, IDELogger, Nullable, RawEvent } from '../../utils';
import LogLevelSwitcher from './logLevelSwitcher';

export const logConsole: JupyterFrontEndPlugin<void> = {
  id: 'persist_ext:log-console',
  autoStart: true,
  requires: [ICommandPalette, IRenderMimeRegistry, ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    restorer: ILayoutRestorer
  ) => {
    const { commands } = app;

    let logConsolePanel: Nullable<LogConsolePanel> = null;
    let logConsoleWidget: Nullable<MainAreaWidget<LogConsolePanel>> = null;

    const tracker = new WidgetTracker<MainAreaWidget<LogConsolePanel>>({
      namespace: 'log-console'
    });

    restorer.restore(tracker as any, {
      command: 'lg/log-console:open',
      name: () => 'Log Console'
    });

    commands.addCommand('lg/log-console:checkpoint', {
      execute: () => logConsolePanel?.logger?.checkpoint(),
      icon: addIcon,
      isEnabled: () => !!logConsolePanel && logConsolePanel.source !== null,
      label: 'Add Checkpoint'
    });

    commands.addCommand('lg/log-console:clear', {
      execute: () => logConsolePanel?.logger?.clear(),
      icon: clearIcon,
      isEnabled: () => !!logConsolePanel && logConsolePanel.source !== null,
      label: 'Clear Log'
    });

    app.commands.addCommand('lg/log-console:download', {
      execute: () => {
        if (!document) {
          return;
        }

        const events: RawEvent[] = [];

        for (let i = 0; i < IDELogger.events.length; ++i) {
          const event = IDELogger.events.get(i);
          const ev: RawEvent = {
            event: event.event,
            date: event.date
          };

          if (event.extra) {
            ev.extra = event.extra;
          }

          events.push(ev);
        }

        const toSave = new Blob([JSON.stringify(events, null, 2)], {
          type: 'application/json'
        });

        const link = document.createElement('a');

        link.download = `IDE_JP_ext_log_${Date.now()}.json`;

        link.href = window.URL.createObjectURL(toSave);
        link.dataset.downloadUrl = [
          'application/json',
          link.download,
          link.href
        ].join(':');

        const evt = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });

        link.dispatchEvent(evt);
        link.remove();
      },
      icon: downloadIcon,
      isEnabled: () => IDELogger.events.length > 0,
      label: 'Download Log'
    });

    commands.addCommand('lg/log-console:level', {
      execute: (args: any) => {
        if (logConsolePanel?.logger) {
          logConsolePanel.logger.level = args.level;
        }
      },
      isEnabled: () => !!logConsolePanel && logConsolePanel.source !== null,
      label: args => `Set Log Level to ${args.level as string}`
    });

    const createLogConsoleWidget = (): void => {
      logConsolePanel = new LogConsolePanel(
        new LoggerRegistry({
          defaultRendermime: rendermime,
          maxLength: 1000
        })
      );

      logConsolePanel.source = 'IDE Logs';

      logConsoleWidget = new MainAreaWidget<LogConsolePanel>({
        content: logConsolePanel
      });
      logConsoleWidget.addClass('jp-LogConsole');
      logConsoleWidget.title.label = 'Log Console';
      logConsoleWidget.title.icon = listIcon;

      logConsoleWidget.toolbar.addItem(
        'checkpoint',
        new CommandToolbarButton({
          commands: app.commands,
          id: 'lg/log-console:checkpoint'
        })
      );

      // logConsoleWidget.toolbar.addItem(
      //   'clear',
      //   new CommandToolbarButton({
      //     commands: app.commands,
      //     id: 'lg/log-console:clear'
      //   })
      // );

      logConsoleWidget.toolbar.addItem(
        'download',
        new CommandToolbarButton({
          commands: app.commands,
          id: 'lg/log-console:download'
        })
      );

      logConsoleWidget.toolbar.addItem(
        'level',
        new LogLevelSwitcher(logConsoleWidget.content)
      );

      const log = (_: any, args: IObservableList.IChangedArgs<Event>) => {
        if (args.type === 'add') {
          args.newValues.forEach(e => {
            switch (e.type) {
              case 'text':
                logConsolePanel?.logger?.log(e as ITextLog);
                break;
              case 'output':
                logConsolePanel?.logger?.log(e as IOutputLog);
                break;
              case 'html':
                logConsolePanel?.logger?.log(e as IHtmlLog);
                break;
              default:
                break;
            }
          });
        }
      };

      logConsoleWidget.disposed.connect(() => {
        logConsoleWidget = null;
        logConsolePanel = null;
        IDELogger.changed.disconnect(log, this);
        commands.notifyCommandChanged();
      });

      app.shell.add(logConsoleWidget, 'main', { mode: 'split-bottom' });
      tracker.add(logConsoleWidget);

      for (let i = 0; i < IDELogger.events.length; ++i) {
        const event = IDELogger.events.get(i);
        switch (event.type) {
          case 'text':
            logConsolePanel?.logger?.log(event as ITextLog);
            break;
          case 'output':
            logConsolePanel?.logger?.log(event as IOutputLog);
            break;
          case 'html':
            logConsolePanel?.logger?.log(event as IHtmlLog);
            break;
          default:
            break;
        }
      }

      IDELogger.changed.connect(log, this);

      logConsoleWidget.update();
      commands.notifyCommandChanged();
    };

    commands.addCommand('lg/log-console:open', {
      label: 'Open Log Console',
      caption: 'Open log console.',
      isToggled: () => logConsoleWidget !== null,
      execute: () => {
        if (logConsoleWidget) {
          logConsoleWidget.dispose();
        } else {
          createLogConsoleWidget();
        }
      }
    });

    palette.addItem({
      command: 'lg/log-console:open',
      category: 'Log Console'
    });

    commands.addCommand('lg/log-console:logHTMLMessage', {
      label: 'HTML log message',
      caption: 'HTML log message.',
      execute: () => {
        const msg: IHtmlLog = {
          type: 'html',
          level: 'debug',
          data: '<div>Hello world HTML!!</div>'
        };

        logConsolePanel?.logger?.log(msg);
      }
    });

    commands.addCommand('lg/log-console:logTextMessage', {
      label: 'Text log message',
      caption: 'Text log message.',
      execute: () => {
        const msg: ITextLog = {
          type: 'text',
          level: 'info',
          data: 'Hello world text!!'
        };

        logConsolePanel?.logger?.log(msg);
      }
    });

    commands.addCommand('lg/log-console:logOutputMessage', {
      label: 'Output log message',
      caption: 'Notebook output log message.',
      execute: () => {
        const data: nbformat.IOutput = {
          output_type: 'display_data',
          data: {
            'text/plain': 'Hello world nbformat!!'
          }
        };

        const msg: IOutputLog = {
          type: 'output',
          level: 'warning',
          data
        };

        logConsolePanel?.logger?.log(msg);
      }
    });
  }
};
