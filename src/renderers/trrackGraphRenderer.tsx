import { ReactWidget } from '@jupyterlab/apputils';
import { PanelLayout, Widget } from '@lumino/widgets';
import React from 'react';
import { TrrackVisComponent, TrrackableCell, TrrackableCellId } from '../cells';
import { Nullable } from '../types';
import { IDEGlobal } from '../utils';

const TRRACK_VIS_HIDE_CLASS = 'jp-TrrackVisWidget-hide';

class TrrackVisWidget extends ReactWidget {
  private _hasVegaPlot: boolean;
  private _cell: TrrackableCell;

  constructor(id: TrrackableCellId) {
    super();
    const cell = IDEGlobal.cells.get(id);
    if (!cell) throw new Error('Cell not found');
    this._cell = cell;

    this._hasVegaPlot = Boolean(IDEGlobal.vegaManager.get(id)?.hasVega);
    this.toggle(this._hasVegaPlot);
  }

  toggle(to: boolean) {
    this.toggleClass(TRRACK_VIS_HIDE_CLASS, !to);
  }

  render() {
    return <TrrackVisComponent cell={this._cell} />;
  }
}

export class RenderedTrrackGraph extends Widget {
  private _panelLayout: PanelLayout;
  private _id: Nullable<TrrackableCellId> = null;
  constructor() {
    super();
    this.layout = this._panelLayout = new PanelLayout();
  }

  render(id: TrrackableCellId): Promise<void> {
    if (id === this._id) return Promise.resolve();

    this._id = id;

    const widget = new TrrackVisWidget(id);

    this._panelLayout.addWidget(widget);

    return Promise.resolve();
  }
}
