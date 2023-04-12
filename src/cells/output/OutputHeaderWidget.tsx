import { ReactWidget } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import React from 'react';
import { TrrackableCell } from '../trrackableCell';
import { OutputHeader } from './OutputHeader';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';

export class OutputHeaderWidget extends ReactWidget {
  private _cellChange = new Signal<this, TrrackableCell>(this);

  constructor() {
    super();
    this.addClass(OUTPUT_HEADER_CLASS);
  }

  associateCell(cell: TrrackableCell) {
    this.show();
    this._cellChange.emit(cell);
  }

  toggle() {
    const status = this.isHidden;

    status ? this.show() : this.hide();

    return this.isHidden;
  }

  render() {
    this.show();
    return <OutputHeader cellChange={this._cellChange} />;
  }
}
