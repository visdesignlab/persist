import { UUID } from '@lumino/coreutils';
import { View } from 'vega';
import { Result } from 'vega-embed';
import {
  isSelectionInterval,
  SelectionInterval,
  VegaSpec
} from '../../../types';
import { debounce, Disposable, IDEGlobal } from '../../../utils';
import { ITrrackManager } from '../trrackManager';

export type Vega = Result;

export class VegaManager extends Disposable {
  private _tManager: ITrrackManager;
  private _listeners: { [key: string]: any } = {};

  constructor(private _cellId: string, private _vega: Vega) {
    super();
    const _tManager = IDEGlobal.trracks.get(_cellId);

    if (!_tManager) {
      throw new Error('No trrack manager found');
    }

    this._tManager = _tManager;

    IDEGlobal.views.set(_cellId, this);

    this._tManager.trrack.currentChange(() => {
      this.apply();
    });

    this.apply();
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.view.finalize();
    IDEGlobal.views.delete(this._cellId);
  }

  get vega() {
    return this._vega;
  }

  get view() {
    return this._vega.view;
  }

  get spec(): VegaSpec {
    return this._vega.spec as VegaSpec;
  }

  async apply() {
    this.removeListeners();
    const { trrack } = this._tManager;

    const { interactions = [] } = trrack.getState();

    if (interactions.length === 0) {
      await this.removeBrushes();
    } else {
      for (const interaction of interactions) {
        if (isSelectionInterval(interaction)) {
          const { name, params } = interaction;
          await this.applySelectionInterval(name, params, true);
        }
      }
      await this.view.runAsync();
    }

    this.addListeners();
  }

  async removeBrushes() {
    for (const selector in this.spec.selection) {
      await this.applySelectionInterval(selector, {
        x: [],
        y: [],
        selection: {}
      });
    }
  }

  addListeners() {
    this.addSelectionListeners();
  }

  addSelectionListeners() {
    for (const selector in this.spec.selection) {
      const listener = debounce(async () => {
        const state = this.view.getState();

        const signals = state.signals;

        const selection: SelectionInterval = {
          id: UUID.uuid4(),
          type: 'selection_interval',
          name: selector,
          dataset: '',
          params: {
            selection: signals[selector],
            x: signals[`${selector}_x`],
            y: signals[`${selector}_y`]
          }
        };

        await this._tManager.addInteraction(selection);
      });

      this._listeners[selector] = listener;
      this.view.addSignalListener(selector, listener);
    }
  }

  removeListeners() {
    this.removeSelectionListeners();
  }

  removeSelectionListeners() {
    for (const selector in this.spec.selection) {
      this.view.removeSignalListener(selector, this._listeners[selector]);
    }
  }

  async applySelectionInterval(
    sel_name: string,
    selection: SelectionInterval['params'],
    skipRun = false
  ): Promise<View> {
    this.view.signal(`${sel_name}_x`, selection.x);
    this.view.signal(`${sel_name}_y`, selection.y);
    if (skipRun) return Promise.resolve(this.view);
    return this.view.runAsync();
  }
}
