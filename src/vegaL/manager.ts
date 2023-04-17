import { JSONValue } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { Trigger } from '@trrack/core';
import { deepClone } from 'fast-json-patch';
import { JSONPath as jp } from 'jsonpath-plus';
import { Result } from 'vega-embed';
import { TrrackableCell } from '../cells';
import { ApplyInteractions } from '../interactions/apply';
import { IDEGlobal, Nullable } from '../utils';
import {
  BaseVegaListener,
  VegaSignalListener,
  getSelectionIntervalListener
} from './listeners';
import { RenderedTrrackVegaOutput } from './renderer';
import { isValidVegalite4Spec } from './types';

export type Vega = Result;

type ListenerEvents = 'selection';

export class VegaManager extends TrrackableCell.ContentManager {
  private _listeners: { [key in ListenerEvents]: Set<BaseVegaListener> };
  private _renderer: Nullable<RenderedTrrackVegaOutput> = null;

  constructor(cell: TrrackableCell) {
    super(cell);

    this._listeners = {
      selection: new Set<BaseVegaListener>()
    };

    this._tManager.currentChange.connect((_, __) => {
      this.update();
    }, this);
  }

  _registerGlobally(): void {
    IDEGlobal.vegaManager.set(this._cell.cellId, this);
  }

  /**
   * When first rendering is done, sync up GUI with provenance graph?
   */
  sync() {
    this.update('sync');
  }

  update(trigger: Trigger | 'reset' | 'sync' = 'sync') {
    const rootSpec = deepClone(this._cell.executionSpec) as Nullable<JSONValue>;

    if (!rootSpec) throw new Error('No execution spec found for cell');

    if (!isValidVegalite4Spec(rootSpec)) {
      console.error('Not a valid vegalite spec', rootSpec);
      throw new Error('Not a valid vegalite spec.');
    }

    const interactions = this._tManager.trrack.getState().interactions;

    const newSpec = new ApplyInteractions(interactions).apply(rootSpec);

    this._cell.updateVegaSpec(newSpec, trigger === 'new' ? 'new' : 'traversal');
  }

  dispose() {
    if (this.isDisposed) return;

    Signal.disconnectReceiver(this);

    this.isDisposed = true;
    this.removeListeners();
    this.renderer?.dispose();
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

  get vega(): Nullable<Vega> {
    return this.renderer?.vega;
  }

  get view() {
    return this.vega?.view;
  }

  get spec(): JSONValue {
    return deepClone(this.vega?.spec || {}) as JSONValue;
  }

  get renderer() {
    return this._renderer;
  }

  async updateRenderer(renderer: RenderedTrrackVegaOutput): Promise<void> {
    this._renderer = renderer;

    this._processVegaSpec();

    return Promise.resolve();
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
    if (!this.view) return;

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
