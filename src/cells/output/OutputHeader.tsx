/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { Button, Divider, Group } from '@mantine/core';
import {
  IconCopy,
  IconFilter,
  IconNotes,
  IconRefresh,
  IconTags
} from '@tabler/icons-react';
import { AddCategoryPopup } from '../../components/AddCategoryPopup';
import { AggregateGroupPopup } from '../../components/AggregateGroupPopup';
import { AssignCategoryPopup } from '../../components/AssignCategoryPopup';
import { CommandButton } from '../../components/CommandButton';
import { CopyNamedDFPopup } from '../../components/CopyNamedDFPopup';
import { RenameColumnPopover } from '../../components/RenameColumnPopover';
import { IDEGlobal, Nullable } from '../../utils';
import { TrrackableCell, TrrackableCellId } from '../trrackableCell';
import { OutputCommandIds } from './commands';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';

type Props = {
  cell: TrrackableCell;
};

export function OutputHeader({ cell }: Props) {
  if (!cell) {
    return null;
  }

  const outputCommandsRegistry = cell.commandRegistry;

  const { commands } = outputCommandsRegistry;

  return (
    <Group>
      <CommandButton
        commands={commands}
        cId={OutputCommandIds.reset}
        icon={<IconRefresh />}
      />
      <Divider orientation="vertical" />
      <CommandButton
        commands={commands}
        cId={OutputCommandIds.filter}
        icon={<IconFilter />}
      />
      <Divider orientation="vertical" />
      <AggregateGroupPopup cell={cell} commands={commands} />
      <Divider orientation="vertical" />
      <Button.Group>
        <CommandButton
          commands={commands}
          cId={OutputCommandIds.copyDynamic}
          icon={
            <IconCopy
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
          }
        />
        <CopyNamedDFPopup cell={cell} />
      </Button.Group>
      <Divider orientation="vertical" />
      <Button.Group>
        <AddCategoryPopup cell={cell} />
        <UseSignal signal={commands.commandChanged}>
          {() => <AssignCategoryPopup cell={cell} commands={commands} />}
        </UseSignal>
      </Button.Group>
      <Divider orientation="vertical" />
      <CommandButton
        commands={commands}
        cId={OutputCommandIds.labelSelection}
        icon={<IconTags />}
      />
      <Divider orientation="vertical" />
      <CommandButton
        commands={commands}
        cId={OutputCommandIds.addNote}
        icon={<IconNotes />}
      />
      <Divider orientation="vertical" />
      <RenameColumnPopover cell={cell} />
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
        return cell ? <OutputHeader cell={cell} /> : null;
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
