import { UUID } from '@lumino/coreutils';
import {
  EventListenerHandler,
  Item,
  ScenegraphEvent,
  SignalListenerHandler,
  View
} from 'vega';
import { Field, Interactions } from '../interactions/types';
import { TrrackManager } from '../trrack/manager';
import { Disposable, IDEGlobal, Nullable } from '../utils';
import { VegaManager } from './manager';

type VegaEventHandlerLike = (...args: any[]) => void;

export abstract class BaseVegaListener<
  T extends VegaEventHandlerLike = VegaEventHandlerLike
> extends Disposable {
  constructor(
    protected _view: View,
    protected _id: string,
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
    if (this.isDisposed) throw new Error(`Handler for ${this._id} is disposed`);
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
    this._view.addSignalListener(this._id, this._listener);
    return this;
  }

  remove() {
    this._view.removeSignalListener(this._id, this._listener);
    return this;
  }
}

export class VegaEventListener extends BaseVegaListener<EventListenerHandler> {
  constructor(view: View, eventName: string, listener: EventListenerHandler) {
    super(view, eventName, listener);
  }

  add() {
    this._view.addEventListener(this._id, this._listener);
    return this;
  }

  remove() {
    this._view.removeEventListener(this._id, this._listener);
    return this;
  }
}

// export function getSelectionSingleListener({
//   manager,
//   selector,
//   trrackManager,
//   cellId
// }: {
//   manager: VegaManager;
//   selector: string;
//   trrackManager: TrrackManager;
//   cellId: string;
// }) {
//   const path = `/selection/${selector}`;

//   const { view } = manager;

//   const cell = IDEGlobal.cells.get(cellId);

//   if (!cell) throw new Error("Cell doesn't exist");

//   const execFn = async () => {
//     const state = view.getState();

//     const signals: SelectionIntervalSignal = state.signals;

//     console.log(signals);

//     const signal = wrapSignal(signals, selector);

//     const params: Interactions.SelectionParams<Interactions.SingleSelectionAction> =
//       {
//         value: signal.pts?.values || []
//       };

//     const selection: Interactions.SingleSelectionAction = {
//       id: UUID.uuid4(),
//       type: 'selection_single',
//       name: selector,
//       path,
//       params
//     };

//     const isEmpty = params.value.length === 0;

//     await trrackManager.actions.addSingleSelection(
//       selection,
//       isEmpty ? 'Clear Selection' : 'Brush selection'
//     );
//   };

//   return debounce(700, execFn);
// }

export function getSelectionIntervalListener({
  manager,
  selector,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  selector: string;
  trrackManager: TrrackManager;
  cellId: string;
}) {
  const path = `/selection/${selector}`;

  const { view } = manager;

  if (!path && !view) {
    console.log('');
  }

  const cell = IDEGlobal.cells.get(cellId);

  if (!cell) throw new Error("Cell doesn't exist");

  const brushStore: {
    x?: Field<2>;
    y?: Field<2>;
  } = {};

  const brushSignal = view.getState({
    signals: (a, _) => {
      return a !== undefined && a?.includes('_tuple_fields');
    }
  });

  const tupleFields = brushSignal.signals[`${selector}_tuple_fields`] || [];
  const xField = tupleFields.filter((f: any) => f.channel === 'x');
  const yField = tupleFields.filter((f: any) => f.channel === 'y');

  const xName: Nullable<string> =
    xField.length === 1 ? xField[0].field : undefined;
  const yName: Nullable<string> =
    yField.length === 1 ? yField[0].field : undefined;

  let brushingActive = false;

  function handleSignalChange(
    _: string,
    value: { [key: string]: [number, number] }
  ) {
    brushingActive = true;

    const xVal = xName ? value[xName] : null;
    const yVal = yName ? value[yName] : null;

    if (xVal && xName) {
      brushStore.x = {
        field: xName,
        range: xVal
      };
    }

    if (yVal && yName) {
      brushStore.y = {
        field: yName,
        range: yVal
      };
    }
  }

  async function handleBrushEnd(_: ScenegraphEvent, __: Nullable<Item>) {
    if (!brushingActive) return;

    brushingActive = false;

    const params: Interactions.IntervalSelectionAction['params'] =
      brushStore.x || brushStore.y ? (brushStore as any) : undefined;

    const selection: Interactions.IntervalSelectionAction = {
      id: UUID.uuid4(),
      type: 'selection_interval',
      name: selector,
      path,
      params
    };

    await trrackManager.actions.addIntervalSelection(
      selection,
      !params ? 'Clear Selection' : 'Brush selection'
    );
  }

  return {
    handleSignalChange,
    handleBrushEnd
  };
  // return debounce(700, execFn);
}
