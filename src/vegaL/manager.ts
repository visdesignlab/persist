import { JSONValue } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import {
  TopLevelSelectionParameter,
  isSelectionParameter
} from 'vega-lite/build/src/selection';
import { isUnitSpec } from 'vega-lite/build/src/spec';
import { TrrackableCell } from '../cells';
import { ApplyInteractions } from '../interactions/apply';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { Disposable, IDEGlobal, Nullable } from '../utils';
import { deepClone } from '../utils/deepClone';
import {
  BaseVegaListener,
  VegaEventListener,
  VegaSignalListener,
  getSelectionIntervalListener,
  getSelectionPointListener
} from './listeners';
import { Vega } from './renderer';
import { Spec, isSelectionInterval, isSelectionPoint } from './spec';

type ListenerEvents = 'selection';

export class VegaManager extends Disposable {
  private _listeners: { [key in ListenerEvents]: Set<BaseVegaListener> };

  constructor(private _cell: TrrackableCell, private _vega: Vega) {
    super();

    this._listeners = {
      selection: new Set<BaseVegaListener>()
    };

    this._tManager.currentChange.connect((_, __) => {
      this.update();
    }, this);

    this._processVegaSpec();
  }

  update() {
    const rootSpec: Nullable<JSONValue> = deepClone(
      this._cell.executionSpec
    ) as any;

    if (!rootSpec) throw new Error('No execution spec found for cell');

    const interactions = getInteractionsFromRoot(this._tManager);

    const newSpec = new ApplyInteractions(interactions, this._cellId).apply(
      rootSpec as any
    );

    this._cell.updateVegaSpec(newSpec);
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.removeListeners();
    this.view.finalize();

    Signal.disconnectAll(this);
  }

  get _cellId() {
    return this._cell.cellId;
  }

  private get _tManager() {
    return this._cell.trrackManager;
  }

  get hasVega() {
    return !!this.view;
  }

  get vega() {
    return this._vega;
  }

  get view() {
    return this._vega.view;
  }

  get spec(): Spec {
    return this._vega.spec as Spec;
  }

  private _processVegaSpec() {
    this.addListeners();
  }

  addListeners() {
    this.addSelectionListeners();
  }

  /**
   * ASSUMPTION IS ALL PARAMS ARE TOPLEVELPARAMETER
   */
  addSelectionListeners() {
    this.removeSelectionListeners();
    // const inputSpec = this.spec;

    const { params = [] } = this.spec;

    const topLevelSelectionParams = params.filter(isSelectionParameter);

    topLevelSelectionParams.forEach(param => {
      const { views = [] } = param as TopLevelSelectionParameter;

      if (!isUnitSpec(this.spec) && views.length === 0) return;

      if (isSelectionInterval(param)) {
        const listener = getSelectionIntervalListener({
          manager: this,
          selector: param,
          views,
          trrackManager: this._tManager,
          cellId: this._cell.cellId
        });

        this._listeners.selection.add(
          new VegaSignalListener(this.view, param.name, _ => {
            listener.handleSignalChange(_);
          })
        );
        this._listeners.selection.add(
          new VegaEventListener(this.view, 'mouseup', listener.handleBrushEnd)
        );
      } else if (isSelectionPoint(param)) {
        const listener = getSelectionPointListener({
          manager: this,
          selector: param,
          views,
          trrackManager: this._tManager,
          cellId: this._cell.cellId
        });

        this._listeners.selection.add(
          new VegaSignalListener(
            this.view,
            param.name,
            listener.handleSignalChange
          )
        );
      }
    });
  }

  removeListeners() {
    this.removeSelectionListeners();
  }

  removeSelectionListeners() {
    // Wrong
    this._listeners.selection.forEach(listener => listener.dispose());
  }
}

export namespace VegaManager {
  export function create(cell: TrrackableCell, vega: Vega) {
    const vegaM = new VegaManager(cell, vega);

    const previous = IDEGlobal.vegaManager.get(cell);
    if (previous) previous.dispose();

    IDEGlobal.vegaManager.set(cell, vegaM);

    return vegaM;
  }
}
