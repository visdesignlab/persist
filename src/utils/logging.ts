import { ILogPayload } from '@jupyterlab/logconsole';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { JSONValue } from '@lumino/coreutils';

export type RawEvent = {
  event: string;
  date: string;
  extra?: JSONValue;
};

export type Event = ILogPayload & RawEvent;
export type Events = IObservableList<Event>;

function getHTML(data: JSONValue) {
  switch (typeof data) {
    case 'object':
      return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    default:
      return data;
  }
}

export class IDELogger {
  static events: IObservableList<Event> = new ObservableList({
    values: [
      {
        type: 'html',
        level: 'info',
        date: new Date().toISOString(),
        data: 'Initialized Logging',
        event: 'Initialized Logging'
      }
    ]
  });

  static get changed() {
    return this.events.changed;
  }

  static log(
    event: string,
    args?: {
      level?: ILogPayload['level'];
      data?: JSONValue;
    }
  ) {
    const { data = null, level = 'info' } = args || {};

    this.events.push({
      type: 'html',
      level,
      date: new Date().toISOString(),
      event,
      extra: data,
      data: `${event}${data ? ` <strong>:</strong> ${getHTML(data)}` : ''}`
    });
  }

  static print(asTable = true) {
    if (asTable) {
      console.table(this.events);
    } else {
      console.log({
        logEvents: this.events
      });
    }
  }
}
