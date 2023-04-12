import { UUID } from '@lumino/coreutils';
import { SignalListenerHandler, View } from 'vega';
import { TrrackManager } from '../trrack/manager';
import { SelectionInterval, SelectionParams } from '../types';
import { debounce, Disposable, IDEGlobal } from '../utils';
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

  const execFn = async () => {
    const state = view.getState();

    const signals: SelectionIntervalSignal = state.signals;

    const x = signals[`${selector}_tuple`].fields.filter(
      a => a.channel === 'x'
    )[0].field;

    const y = signals[`${selector}_tuple`].fields.filter(
      a => a.channel === 'y'
    )[0].field;

    if (!x || !y)
      throw new Error(`No x or y channel found: X = ${x}, Y = ${y}`);

    const params: SelectionParams<SelectionInterval> = {
      x,
      y,
      domain: {
        x: signals[selector][x],
        y: signals[selector][y]
      },
      pixel: {
        x: signals[`${selector}_x`],
        y: signals[`${selector}_y`]
      }
    };

    const selection: SelectionInterval = {
      id: UUID.uuid4(),
      type: 'selection_interval',
      name: selector,
      path,
      params
    };

    await trrackManager.actions.addIntervalSelection(
      selection,
      'Brush selection'
    );
  };

  return debounce(execFn);
}
