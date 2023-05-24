import { IDisposable } from '@lumino/disposable';

export abstract class Disposable implements IDisposable {
  private _isDisposed = false;

  get isDisposed() {
    return this._isDisposed;
  }

  set isDisposed(value: boolean) {
    this._isDisposed = value;
  }

  abstract dispose(): void;
}
