import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { IDEGlobal } from '../../utils/IDEGlobal';
import { TrrackableCell } from '../trrackableCell';
import { OutputHeader } from './OutputHeader';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';
const OUTPUT_HEADER_HIDE_CLASS = 'jp-OutputHeaderWidget-hide';

export class OutputHeaderWidget extends ReactWidget {
  private _hasVegaPlot: boolean;

  constructor(private _cell: TrrackableCell) {
    super();
    this.addClass(OUTPUT_HEADER_CLASS);

    this._hasVegaPlot = Boolean(IDEGlobal.views.get(_cell.cellId));
    this.toggle(this._hasVegaPlot);
  }

  toggle(to: boolean) {
    this.toggleClass(OUTPUT_HEADER_HIDE_CLASS, !to);
  }

  render() {
    return this._hasVegaPlot ? <OutputHeader cell={this._cell} /> : null;
  }
}

// console.log(window.views.get(id)?.view.getState());
// console.log(window.views.get(id)?.vega.vgSpec);
// const vega: any = window.views.get(id)?.vega;
// // can remove here
// const data_ = vega?.vgSpec.data[1];
// const data = data_.values;

// const params = vega.view.getState().signals['brush'];

// const fields = Object.keys(params);
// const a = params[fields[0]];
// const b = params[fields[1]];

// const filteredData = data.filter((d: any) => {
//   const x = d[fields[0]];
//   const y = d[fields[1]];

//   return x >= a[0] && x <= a[1] && y >= b[0] && y <= b[1];
// });

// window.views.get(id)?.vega.view.remove(data_.name, filteredData);
// window.views.get(id)?.vega.view.runAsync();
