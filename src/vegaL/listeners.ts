import { UUID } from '@lumino/coreutils';
import { isArray } from 'lodash';
import {
  EventListenerHandler,
  Item,
  ScenegraphEvent,
  SignalListenerHandler,
  View
} from 'vega';
import {
  LegendBinding,
  SelectionInitMapping,
  SelectionParameter
} from 'vega-lite/build/src/selection';
import { Interactions } from '../interactions/types';
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
    if (this.isDisposed) {
      throw new Error(`Handler for ${this._id} is disposed`);
    }
    this.add();
    return this;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
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

export function getSelectionIntervalListener({
  manager,
  selector,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  selector: SelectionParameter<'interval'>;
  views: string[];
  trrackManager: TrrackManager;
  cellId: string;
}) {
  const { view } = manager;

  const cell = IDEGlobal.cells.get(cellId);

  if (!cell) {
    throw new Error("Cell doesn't exist");
  }

  const encodingTypes = manager.encodingTypes;

  let valueRange: any = null;

  let brushingActive = false;

  function handleSignalChange(_: string) {
    brushingActive = true;
    valueRange = view.signal(selector.name);

    console.log('Test');
  }

  async function handleBrushEnd(_: ScenegraphEvent, __: Nullable<Item>) {
    if (!brushingActive) {
      return;
    }

    if (Object.keys(valueRange).length === 0) {
      valueRange = null;
    }

    brushingActive = false;

    for (const col in valueRange) {
      if (!col.includes('_')) {
        continue;
      }

      const fieldNameOnly = col.split('_').slice(1).join('_');

      const { timeUnit = null } = encodingTypes[fieldNameOnly] || {};

      const range: any[] = valueRange[col];

      if (timeUnit) {
        valueRange[col] = range.map(r => new Date(r).getTime());
      }
    }

    const selection: Interactions.SelectionAction = {
      ...selector,
      type: 'selection',
      id: UUID.uuid4(),
      selected: {
        value: valueRange,
        encodingTypes
      }
    };

    await trrackManager.actions.addSelection(selection, () => {
      return getLabelMaker(valueRange);
    });
  }

  return {
    handleSignalChange,
    handleBrushEnd
  };
  // return debounce(700, execFn);
}

// POINT SELECTION
export function getSelectionPointListener({
  manager,
  selector,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  selector: SelectionParameter<'point'>;
  views: string[];
  trrackManager: TrrackManager;
  cellId: string;
}) {
  const { view } = manager;

  const cell = IDEGlobal.cells.get(cellId);

  if (!cell) {
    throw new Error("Cell doesn't exist");
  }

  const encodingTypes = manager.encodingTypes;

  let value: SelectionInitMapping[] = [];

  async function handleSignalChange(_: string) {
    value = view.signal(selector.name)?.vlPoint?.or || [];

    value.forEach((val, idx) => {
      for (const col in val) {
        if (!col.includes('_')) {
          return;
        }

        const fieldNameOnly = col.split('_').slice(1).join('_');

        const { timeUnit = null } = encodingTypes[fieldNameOnly] || {};
        const maybeTime = val[col] as any;
        if (timeUnit && maybeTime) {
          if (maybeTime.getTime) {
            value[idx][col] = maybeTime.getTime();
          } else {
            value[idx][col] = new Date(maybeTime).getTime();
          }
        }
      }
    });

    const selection: Interactions.SelectionAction = {
      ...selector,
      id: UUID.uuid4(),
      type: 'selection',
      selected: {
        value,
        encodingTypes
      }
    };

    await trrackManager.actions.addSelection(selection as any, () => {
      return getLabelMaker(value);
    });
  }

  return {
    handleSignalChange
  };
  // return debounce(700, execFn);
}

export function getLegendSelectorListener({
  manager,
  selector,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  selector: SelectionParameter<'point'>;
  bind: LegendBinding;
  views: string[];
  trrackManager: TrrackManager;
  cellId: string;
}) {
  const { view } = manager;

  const cell = IDEGlobal.cells.get(cellId);

  if (!cell) {
    throw new Error("Cell doesn't exist");
  }

  let value: SelectionParameter<'point'>['value'] = undefined;

  async function handleSignalChange(_: string) {
    value = view.signal(selector.name)?.vlPoint?.or || [];

    const selection: Interactions.SelectionAction = {
      ...selector,
      id: UUID.uuid4(),
      type: 'selection',
      selected: {} as any
    };

    await trrackManager.actions.addSelection(selection as any, () =>
      getLabelMaker(value)
    );
  }

  return {
    handleSignalChange
  };
  // return debounce(700, execFn);
}

function getLabelMaker(value: SelectionParameter['value']) {
  if (!value) {
    return 'Clear selection';
  }

  if (isArray(value) && value.length === 0) {
    return 'Clear selection';
  }

  return 'Brush selection';
}
