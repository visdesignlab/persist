/* eslint-disable @typescript-eslint/no-empty-function */
import { ISignal } from '@lumino/signaling';
import React, { useEffect, useMemo, useState } from 'react';
import { CommandButton } from '../../components/CommandButton';
import { Nullable } from '../../utils';
import { TrrackableCell } from '../trrackableCell';
import { OutputCommandIds, OutputCommandRegistry } from './commands';

import { ReactWidget } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';

type Props = {
  cellChange: ISignal<OutputHeaderWidget, TrrackableCell>;
};

const _commands = [OutputCommandIds.reset, OutputCommandIds.filter];

export function OutputHeader(props: Props) {
  const [cell, setCell] = useState<Nullable<TrrackableCell>>(null);

  const outputCommandsRegistry = useMemo(() => {
    if (!cell) return null;
    return new OutputCommandRegistry(cell);
  }, [cell]);

  useEffect(() => {
    const listener = (_: OutputHeaderWidget, newCell: TrrackableCell) => {
      setCell(newCell);
    };

    props.cellChange.connect(listener);

    return () => {
      props.cellChange.disconnect(listener);
    };
  }, [props.cellChange]);

  if (!outputCommandsRegistry) return null;

  return (
    <>
      {_commands.map(id => (
        <CommandButton commands={outputCommandsRegistry.commands} cId={id} />
      ))}
    </>
  );
}

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
