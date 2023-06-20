/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';
import { CommandButton } from '../../components/CommandButton';
import { IDEGlobal, Nullable } from '../../utils';
import { TrrackableCell, TrrackableCellId } from '../trrackableCell';
import { OutputCommandIds, OutputCommandRegistry } from './commands';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';

type Props = {
  cell: Nullable<TrrackableCell>;
};

const _commands = [
  OutputCommandIds.reset,
  OutputCommandIds.filter,
  OutputCommandIds.aggregate,
  OutputCommandIds.copyDynamic
];

export function OutputHeader({ cell }: Props) {
  if (!cell) {
    return <div>Something</div>;
  }

  const outputCommandsRegistry = new OutputCommandRegistry(cell);

  return (
    <>
      {_commands.map(id => (
        <CommandButton commands={outputCommandsRegistry.commands} cId={id} />
      ))}
    </>
  );
}

function OutputHeaderWithSignal({
  signal
}: {
  signal: ISignal<any, TrrackableCell>;
}) {
  return (
    <UseSignal signal={signal}>
      {(_, cell) => {
        return <OutputHeader cell={cell} />;
      }}
    </UseSignal>
  );
}

export class OutputHeaderWidget extends ReactWidget {
  private _cellChange = new Signal<this, TrrackableCell>(this);
  private _cell: Nullable<TrrackableCell> = null;

  constructor() {
    super();
    this.addClass(OUTPUT_HEADER_CLASS);
  }

  async associateCell(id: TrrackableCellId) {
    this.show();

    this.render();
    await this.renderPromise;

    const cell = IDEGlobal.cells.get(id);

    if (!cell) {
      throw new Error('Cell not found');
    }

    if (cell !== this._cell) {
      this._cell = cell;
      this._cellChange.emit(this._cell);
    }
  }

  toggle() {
    const status = this.isHidden;

    status ? this.show() : this.hide();

    return this.isHidden;
  }

  render() {
    this.show();

    return <OutputHeaderWithSignal signal={this._cellChange} />;
  }
}
