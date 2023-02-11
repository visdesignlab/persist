import { JupyterFrontEnd } from '@jupyterlab/application';
import { ISignal, Signal } from '@lumino/signaling';

export class Restorer {
  static restore: ISignal<JupyterFrontEnd, string>;

  static get emitter() {
    return this.restore as Signal<JupyterFrontEnd, string>;
  }

  static init(app: JupyterFrontEnd) {
    Restorer.restore = new Signal<JupyterFrontEnd, string>(app);
  }
}
