import { NotebookPanel } from '@jupyterlab/notebook';
import { JSONArray, ReadonlyJSONValue } from '@lumino/coreutils';

export type Event = {
  name: string;
  date: Date; // maybe switch to string for just datetime stamp?
  data?: ReadonlyJSONValue;
};

export type Logging = {
  log(name: string, data?: ReadonlyJSONValue): void;
  setNotebook(nb: NotebookPanel): void;
  print(): void;
  save(): void;
  autoSave(enable: boolean | number): void;
};

function init(): Logging {
  const events: Event[] = [];
  let notebook: NotebookPanel | null = null;

  let timer: number | null = null;

  setInterval(() => {
    save();
  }, 5000);

  function log(name: string, data?: ReadonlyJSONValue) {
    if (data) events.push({ name, date: new Date(), data });
    else events.push({ name, date: new Date() });
  }

  function print(asTable = true) {
    if (asTable) console.table(events);
    else
      console.log({
        logEvents: events
      });
  }

  function setNotebook(nb: NotebookPanel) {
    notebook = nb;
  }

  function save() {
    notebook?.model?.metadata.set(
      'ext-ide-logs',
      events as unknown as JSONArray
    );

    window.logs = events;
  }

  function autoSave(enable: boolean | number = 5000) {
    if (timer) {
      clearInterval(timer);
    }

    if (typeof enable === 'number') {
      timer = setInterval(() => {
        save();
      }, enable);
    }
  }

  return {
    log,
    print,
    setNotebook,
    save,
    autoSave
  };
}

const LOG = init();

window.LOGGER = LOG;
LOG.log('logging initialized');
LOG.save();

export default LOG;
