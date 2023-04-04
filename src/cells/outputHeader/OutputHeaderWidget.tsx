import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { TrrackableCell } from '../trrackableCell';
import { OutputHeader } from './OutputHeader';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';
const OUTPUT_HEADER_HIDE_CLASS = 'jp-OutputHeaderWidget-hide';

export class OutputHeaderWidget extends ReactWidget {
  private _hasVegaPlot: boolean;

  constructor(private _cell: TrrackableCell) {
    super();
    this.addClass(OUTPUT_HEADER_CLASS);

    this._hasVegaPlot = Boolean(_cell.vegaManager.hasVega);
    this.toggle(this._hasVegaPlot);
  }

  toggle(to: boolean) {
    this.toggleClass(OUTPUT_HEADER_HIDE_CLASS, !to);
  }

  render() {
    return this._hasVegaPlot ? <OutputHeader cell={this._cell} /> : null;
  }
}
