import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { TrrackableCell, TrrackableCellId } from '../cells/trrackableCell';
import { IDEGlobal } from '../utils';
import { TrrackVisComponent } from './component';

const TRRACK_VIS_HIDE_CLASS = 'jp-TrrackVisWidget-hide';

export const DF_NAME = 'df_name';

export class TrrackVisWidget extends ReactWidget {
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
