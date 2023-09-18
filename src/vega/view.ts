import { SignalListener } from 'react-vega';
import { View } from 'vega';
import { Nullable } from '../utils/nullable';

export class VegaView {

  private _ensureView(throw: boolean = false) {
    if (!this._view) {
if (throw) console.log("No view defined");
      else throw new Error("No error defined")
    }
  }


}


export class SignalsManager {
  private _signals: Set<SignalHandler> = new Set();

  add(signal: SignalHandler) {
    if (!this._signals.has(signal)) this._signals.add(signal);
  }

  remove(signal: SignalHandler) {
    if (this._signals.has(signal)) {
      signal.remove();
      this._signals.delete(signal);
    }
  }

  pause() {
    this._signals.forEach(s => s.pause());
  }

  resume() {
    this._signals.forEach(s => s.resume());
  }
}

class SignalHandler implements IDisposable {
  isDisposed = false;

  constructor(
    private view: View,
    private signalName: string,
    private handler: SignalListener,
    private type: 'data' | 'signal' = 'signal'
  ) {
    this.add();
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }

    this.remove();

    this.isDisposed = true;
  }

  pause() {
    this.remove();
  }

  resume() {
    this.add();
  }

  add() {
    if (this.type === 'signal') {
      this.view.addSignalListener(this.signalName, this.handler);
    } else {
      this.view.addDataListener(this.signalName, this.handler);
    }
  }

  remove() {
    if (this.type === 'signal') {
      this.view.removeSignalListener(this.signalName, this.handler);
    } else {
      this.view.removeSignalListener(this.signalName, this.handler);
    }
  }
}
