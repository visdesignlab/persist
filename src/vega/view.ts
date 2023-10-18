import { IDisposable } from '@lumino/disposable';
import { SignalListener } from 'react-vega';
import { View } from 'vega';
import { Nullable } from '../utils/nullable';

export class VegaView implements IDisposable {
  isDisposed = false;

  private _skip = false;

  protected _view: Nullable<View> = null;
  private _signals: SignalsManager;

  private _listenerUnsubscribers: Set<() => void> = new Set();

  constructor() {
    this._signals = new SignalsManager();
  }

  setView(view: View) {
    if (this._view !== view) {
      this.clear();
      this._view?.finalize();
    }
    this._view = view;
  }

  setSignal(name: string, value: unknown) {
    if (!this.hasView()) {
      return null;
    }

    this._view.signal(name, value);
  }

  setData(storeName: string, values: Array<unknown>) {
    if (!this.hasView()) {
      return null;
    }

    this._view.data(storeName, values);
  }

  getData(storeName: string) {
    if (!this.hasView()) {
      return null;
    }

    return this._view.data(storeName);
  }

  hasView(): this is { _view: View } {
    return !!this._view;
  }

  pause() {
    this._signals.pause();
  }

  resume() {
    this._signals.resume();
  }

  clear() {
    this._listenerUnsubscribers.forEach(fn => fn());
    this._listenerUnsubscribers.clear();
  }

  wrapListener(listener: SignalListener): SignalListener {
    return (name: string, value: unknown) => {
      if (!this._skip) {
        listener(name, value);
      }
    };
  }

  addDataStoreListener(dataStoreName: string, listener: SignalListener) {
    if (!this.hasView()) {
      return () => {
        //
      };
    }
    const handler = new SignalHandler(
      this._view,
      dataStoreName,
      this.wrapListener(listener),
      'data'
    );
    this._signals.add(handler);

    const removeFn = () => {
      this.removeSignalListener(handler);
    };

    this._listenerUnsubscribers.add(removeFn);

    return removeFn;
  }

  removeDataStoreListener(handler: SignalHandler) {
    this._signals.remove(handler);
  }

  addSignalListener(signalName: string, listener: SignalListener) {
    if (!this.hasView()) {
      return () => {
        //
      };
    }
    const handler = new SignalHandler(
      this._view,
      signalName,
      this.wrapListener(listener),
      'signal'
    );
    this._signals.add(handler);

    return () => {
      this.removeSignalListener(handler);
    };
  }

  removeSignalListener(handler: SignalHandler) {
    this._signals.remove(handler);
  }

  async run() {
    if (!this.hasView()) {
      return Promise.resolve();
    }
    this._skip = true;
    await this._view.runAsync();
    this._skip = false;
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
  }
}

export class SignalsManager {
  private _signals: Set<SignalHandler> = new Set();

  add(signal: SignalHandler) {
    if (!this._signals.has(signal)) {
      this._signals.add(signal);
    }
  }

  remove(signal: SignalHandler) {
    if (this._signals.has(signal)) {
      signal.dispose();
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
    private type: 'data' | 'signal'
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
