import { JSONArray, JSONValue, UUID } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { applyPatch, deepClone, RemoveOperation } from 'fast-json-patch';
import { JSONPath as jp } from 'jsonpath-plus';
import { Result } from 'vega-embed';
import { RenderedVega2 } from '../../../renderers';
import { Interactions, Nullable } from '../../../types';
import { Disposable, IDEGlobal } from '../../../utils';
import { TrrackableCell } from '../../trrackableCell';
import { ITrrackManager } from '../trrackManager';
import { getRangeFromSelectionInterval } from './helpers';
import { getSelectionIntervalListener } from './listeners';

export type Vega = Result;

export class VegaManager extends Disposable {
  static init(cellId: string, renderedVega: RenderedVega2, spec: JSONValue) {
    return new VegaManager(cellId, renderedVega, spec);
  }

  static previous: VegaManager[] = [];

  static disposePrevious() {
    this.previous.forEach(v => v.dispose());
    this.previous = [];
  }

  private _tManager: ITrrackManager;
  private _listeners: { [key: string]: any } = {};
  private _cellId: string;
  private _originalVegaSpec: JSONValue;
  private _cell: TrrackableCell;

  constructor(
    cellId: string,
    public vegaRenderer: RenderedVega2,
    initVegaSpec: JSONValue
  ) {
    super();

    VegaManager.disposePrevious();
    VegaManager.previous.push(this);

    this._cellId = cellId;

    const _tManager = IDEGlobal.trracks.get(cellId);

    if (!_tManager) {
      throw new Error('No trrack manager found');
    }

    this._tManager = _tManager;

    IDEGlobal.views.set(cellId, this);

    const cell = IDEGlobal.cells.get(cellId);

    if (!cell) throw new Error("Cell doesn't exist");

    this._cell = cell;

    this._originalVegaSpec = cell.getoriginalSpec() || initVegaSpec;

    cell.saveOriginalSpec(this._originalVegaSpec);

    this._tManager.currentChange.connect(() => {
      const interactions = deepClone(
        this._tManager.trrack.getState().interactions
      ) as Interactions;
      const interaction = interactions.pop();
      cell.updateVegaSpec(
        interaction ? interaction.spec : this._originalVegaSpec
      );
    }, this);
  }

  dispose() {
    if (this.isDisposed) return;
    Signal.disconnectReceiver(this);
    this.isDisposed = true;
    this.view?.finalize();
    IDEGlobal.views.delete(this._cellId);
  }

  get vega(): Nullable<Vega> {
    return this.vegaRenderer?.vega;
  }

  get view() {
    return this.vega?.view;
  }

  get spec(): JSONValue {
    return (this.vega ? this.vega.spec : this._originalVegaSpec) as JSONValue;
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
          spec: this.spec,
          selectionPath,
          trrackManager: this._tManager,
          cellId: this._cellId
        });

        this._listeners[selector] = listener;
        this.view.addSignalListener(selector, listener);
      }
    }
  }

  removeListeners() {
    this.removeSelectionListeners();
  }

  removeSelectionListeners() {
    // Wrong
    for (const selector in this._listeners) {
      this.view?.removeSignalListener(selector, this._listeners[selector]);
    }
  }

  filter() {
    const spec = this.spec as any;

    const interactions = this._tManager.trrack
      .getState()
      .interactions.filter(i => i.type === 'selection_interval');

    if (interactions.length === 0) return;

    spec.transform = spec.transform || [];

    const filters: JSONArray = [];

    const selectionPaths = jp({
      path: '$..selection[?(@parentProperty !== "encoding")]',
      json: this.spec,
      resultType: 'all'
    });

    const removeOps: RemoveOperation[] = [];

    for (let i = 0; i < selectionPaths.length; ++i) {
      const selectionPath = selectionPaths[i];
      const value = selectionPath.value;
      const init = value?.init;
      const type = selectionPath.value.type;

      if (init) {
        if (type === 'interval') {
          filters.push({
            not: {
              and: getRangeFromSelectionInterval(init)
            }
          });
        }

        removeOps.push({
          op: 'remove',
          path: `${selectionPath.pointer}/init`
        });
      }
    }

    const filterPaths = jp({
      path: '$..transform[?(@.filter)]',
      json: this.spec,
      resultType: 'all'
    }) as any[];

    const previousFilters = [].concat(
      ...filterPaths.map(p => p.value.filter.and)
    );

    console.log(filters);
    console.log(previousFilters);
    console.log([...filters, ...previousFilters]);

    const newSpec = applyPatch(
      deepClone(spec),
      deepClone([
        ...removeOps,
        {
          op: 'add',
          path: '/transform',
          value: []
        },
        {
          op: 'add',
          path: '/transform/0',
          value: {
            filter: {}
          }
        },
        {
          op: 'add',
          path: '/transform/0/filter',
          value: {
            and: [...filters, ...previousFilters]
          }
        }
      ])
    ).newDocument;

    this._tManager.addInteraction({
      id: UUID.uuid4(),
      type: 'filter',
      path: '',
      spec: newSpec
    });

    this._cell.updateVegaSpec(newSpec);
  }
}
