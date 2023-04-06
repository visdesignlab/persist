import { ReactWidget } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import React from 'react';
import { TrrackableCell } from '../trrackableCell';
import { OutputHeader } from './OutputHeader';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';
const OUTPUT_HEADER_HIDE_CLASS = 'jp-OutputHeaderWidget-hide';

export class OutputHeaderWidget extends ReactWidget {
  private _cellChange = new Signal<this, TrrackableCell>(this);

  constructor() {
    super();
    this.addClass(OUTPUT_HEADER_CLASS);
  }

  associateCell(cell: TrrackableCell) {
    this._cellChange.emit(cell);
  }

  toggle(to: boolean) {
    this.toggleClass(OUTPUT_HEADER_HIDE_CLASS, !to);
  }

  render() {
    return <OutputHeader cellChange={this._cellChange} />;
  }
}
