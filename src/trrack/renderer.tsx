import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';
import { TrrackableCell, TrrackableCellId } from '../cells/trrackableCell';
import { IDEGlobal, Nullable } from '../utils';
import { TrrackVisComponent } from './component';

export const DF_NAME = 'df_name';

export function SignalledTrrackVisComponent(props: {
  cellChange: ISignal<RenderedTrrackGraph, TrrackableCell>;
}) {
  return (
    <UseSignal signal={props.cellChange}>
      {(_, cell) => (cell ? <TrrackVisComponent cell={cell} /> : null)}
    </UseSignal>
  );
}

export class RenderedTrrackGraph extends ReactWidget {
  private _cell: Nullable<TrrackableCell> = null;
  private _cellChange: Signal<this, TrrackableCell> = new Signal(this);

  async tryRender(id: TrrackableCellId): Promise<void> {
    this.show(); // TODO: is this necessary?
    this.render();
    await this.renderPromise;

    // Check if trrack vis already rendered and exit early
    const cell = IDEGlobal.cells.get(id);
    if (!cell) {
      throw new Error('Cell not found');
    }

    if (cell !== this._cell) {
      this._cell = cell;
      this._cellChange.emit(this._cell);
    }
  }

  render() {
    return <SignalledTrrackVisComponent cellChange={this._cellChange} />;
  }
}
