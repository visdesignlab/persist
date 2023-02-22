type DisposeFunction = () => void;
import { IDisposable } from '@lumino/disposable';

export class DisposableSignal<SignalType extends string>
  implements IDisposable
{
  private _toDispose: Map<SignalType, DisposeFunction[]>;

  private _isDisposed = true;

  constructor(init: { [key in SignalType]: DisposeFunction[] }) {
    this._toDispose = new Map(
      Object.entries(init) as [SignalType, DisposeFunction[]][]
    );
    this._isDisposed = false;
  }

  get isDisposed() {
    return this._isDisposed;
  }

  add(key: SignalType, fn: DisposeFunction) {
    this._toDispose.get(key)?.push(fn);
  }

  clear(key: SignalType) {
    this._toDispose.get(key)?.forEach(f => f());
    this._toDispose.set(key, []);
  }

  dispose(): void {
    for (const [key, _] of this._toDispose) {
      this.clear(key);
    }
    this._isDisposed = true;
  }
}
