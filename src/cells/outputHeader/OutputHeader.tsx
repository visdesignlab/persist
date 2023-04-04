/* eslint-disable @typescript-eslint/no-empty-function */
import { ISignal } from '@lumino/signaling';
import React, { useEffect, useMemo, useState } from 'react';
import { CommandButton } from '../../components/CommandButton';
import { Nullable } from '../../types';
import { TrrackableCell } from '../trrackableCell';
import { OutputHeaderWidget } from './OutputHeaderWidget';
import { OutputCommandIds, OutputCommandRegistry } from './commands';

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
