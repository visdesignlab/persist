import { UUID } from '@lumino/coreutils';
import { SignalListenerHandler, View } from 'vega';
import { TrrackManager } from '../trrack/manager';
import { SelectionInterval } from '../types';
import { Disposable, IDEGlobal, debounce } from '../utils';
import { VegaManager } from './manager';
import { SelectionIntervalSignal } from './types';

type VegaEventHandlerLike = (...args: any[]) => void;

export abstract class BaseVegaListener<
  T extends VegaEventHandlerLike = VegaEventHandlerLike
> extends Disposable {
  constructor(
    protected _view: View,
    protected _signalName: string,
    protected _listener: T
  ) {
    super();
    this.add();
  }

  public abstract add(): this;

  public abstract remove(): this;

  public pause() {
    this.remove();
    return this;
  }

  public resume() {
    if (this.isDisposed)
      throw new Error(`Handler for ${this._signalName} is disposed`);
    this.add();
    return this;
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.remove();
  }
}

export class VegaSignalListener extends BaseVegaListener<SignalListenerHandler> {
  constructor(view: View, signalName: string, listener: SignalListenerHandler) {
    super(view, signalName, listener);
  }

  add() {
    this._view.addSignalListener(this._signalName, this._listener);
    return this;
  }

  remove() {
    this._view.removeSignalListener(this._signalName, this._listener);
    return this;
  }
}

export function getSelectionIntervalListener({
  manager,
  selectionPath,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  selectionPath: any;
  trrackManager: TrrackManager;
  cellId: string;
}) {
  const selector = selectionPath.parentProperty as string;
  const path = selectionPath.pointer;

  const { view, renderer } = manager;

  if (!renderer || !view) throw new Error('Vega or view not found');

  const cell = IDEGlobal.cells.get(cellId);
  if (!cell) throw new Error("Cell doesn't exist");

  return debounce(async () => {
    const state = view.getState();

    const signals: SelectionIntervalSignal = state.signals;

    console.log(selector);
    console.log(path);
    console.log(signals);

    const params: SelectionInterval['params'] = {
      selection: signals[selector],
      x: signals[`${selector}_x`],
      y: signals[`${selector}_y`]
    };

    const selection: SelectionInterval = {
      id: UUID.uuid4(),
      type: 'selection_interval',
      name: selector,
      path,
      params
    };

    await trrackManager.addInteraction(selection, 'Brush selection');
  });
}
