import { JSONValue } from '@lumino/coreutils';

import { Signal } from '@lumino/signaling';
import { deepClone } from 'fast-json-patch';
import { JSONPath as jp } from 'jsonpath-plus';
import { TrrackableCell } from '../cells';
import { ApplyInteractions } from '../interactions/apply';
import { Disposable, IDEGlobal, Nullable } from '../utils';
import {
  BaseVegaListener,
  VegaSignalListener,
  getSelectionIntervalListener
} from './listeners';
import { Vega } from './renderer';
import { Vegalite4Spec, isValidVegalite4Spec } from './types';

type ListenerEvents = 'selection';

export class VegaManager extends Disposable {
  private _listeners: { [key in ListenerEvents]: Set<BaseVegaListener> };

  constructor(private _cell: TrrackableCell, private _vega: Vega) {
    super();

    this._listeners = {
      selection: new Set<BaseVegaListener>()
    };

    this._tManager.currentChange.connect((_, __) => {
      console.log('Has triggered');
      this.update();
    }, this);

    this._processVegaSpec();
  }

  update() {
    const rootSpec: Nullable<JSONValue> = deepClone(this._cell.executionSpec);

    if (!rootSpec) throw new Error('No execution spec found for cell');

    if (!isValidVegalite4Spec(rootSpec)) {
      console.error('Not a valid vegalite spec', rootSpec);
      throw new Error('Not a valid vegalite spec.');
    }

    const interactions = this._tManager.trrack.getState().interactions;

    const newSpec = new ApplyInteractions(interactions).apply(rootSpec);

    this._cell.updateVegaSpec(newSpec);
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.removeListeners();
    this.view.finalize();

    Signal.disconnectAll(this);
  }

  private get _cellId() {
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

  get spec(): Vegalite4Spec {
    return this._vega.spec as Vegalite4Spec;
  }

  async removeBrushes() {
    // for (const selector in (this.spec as any).selection) {
    //   await this.applySelectionInterval(selector, {
    //     x: [],
    //     y: [],
    //     selection: {}
    //   });
    // }
  }

  private _processVegaSpec() {
    this.addListeners();
  }

  addListeners() {
    this.addSelectionListeners();
  }

  addSelectionListeners() {
    this.removeSelectionListeners();

    const selectionPaths = jp({
      path: '$..selection[?(@parentProperty !== "encoding")]',
      json: this.spec,
      resultType: 'all'
    });

    for (let i = 0; i < selectionPaths.length; ++i) {
      const selectionPath = selectionPaths[i];
      const type = selectionPath.value.type;
      const selector = selectionPath.parentProperty;

      if (type === 'interval') {
        const listener = getSelectionIntervalListener({
          manager: this,
          selectionPath,
          trrackManager: this._tManager,
          cellId: this._cellId
        });

        this._listeners.selection.add(
          new VegaSignalListener(this.view, selector, listener)
        );
      }
    }
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
