/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { CommandButton } from '../../components/CommandButton';
import { IDEGlobal, Nullable } from '../../utils';
import { TrrackableCell, TrrackableCellId } from '../trrackableCell';
import { OutputCommandIds, OutputCommandRegistry } from './commands';
import { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Group } from '@mantine/core';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';

type Props = {
  cell: Nullable<TrrackableCell>;
};

const _commands = [
  OutputCommandIds.reset,
  OutputCommandIds.categorize,
  OutputCommandIds.copyDynamic
];

export function OutputHeader({ cell }: Props) {
  const [categories, setCategories] = useState<string[]>(
    cell?.categories || []
  );

  useEffect(() => {
    console.log(categories);
    if (!categories && cell) {
      setCategories(cell.categories);
    }
    if (cell) {
      cell.categories = categories;
    }
  }, [categories, cell]);

  if (!cell) {
    return <div>Something</div>;
  }

  const outputCommandsRegistry = new OutputCommandRegistry(cell);

  return (
    <Group>
      {_commands.map(id => (
        <CommandButton
          categories={id === OutputCommandIds.categorize ? categories : null}
          commands={outputCommandsRegistry.commands}
          colorScale={cell.categoryColorScale}
          setCategories={(s: string) => setCategories([...categories, s])}
          cId={id}
        />
      ))}
    </Group>
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
