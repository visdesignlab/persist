/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { Button, Divider, Group } from '@mantine/core';
import {
  IconFilter,
  IconNotes,
  IconRefresh,
  IconSquareHalf,
  IconTags
} from '@tabler/icons-react';
import { AddCategoryPopup } from '../../components/AddCategoryPopup';
import { AggregateGroupPopup } from '../../components/AggregateGroupPopup';
import { AssignCategoryPopup } from '../../components/AssignCategoryPopup';
import { CommandButton } from '../../components/CommandButton';
import { CopyDFPopup } from '../../components/CopyDFPopup';
import { DropColumnPopover } from '../../components/DropColumnsPopover';
import { RenameColumnPopover } from '../../components/RenameColumnPopover';
import { Nullable } from '../../utils';
import { TrrackableCell } from '../trrackableCell';
import { OutputCommandIds } from './commands';

const OUTPUT_HEADER_CLASS = 'jp-OutputHeaderWidget';

type Props = {
  cell: TrrackableCell;
};

export function OutputHeader({ cell }: Props) {
  if (!cell) {
    return null;
  }

  // const showAggregateOriginal = useHookstate(cell.showAggregateOriginal);

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
      <UseSignal signal={commands.commandChanged}>
        {() => <RenameColumnPopover cell={cell} commands={commands} />}
      </UseSignal>
      <UseSignal signal={commands.commandChanged}>
        {() => <DropColumnPopover cell={cell} commands={commands} />}
      </UseSignal>
      <Divider orientation="vertical" />
      <CommandButton
        commands={commands}
        cId={OutputCommandIds.invertSelection}
        icon={<IconSquareHalf />}
      />
      <Divider orientation="vertical" />
      <CommandButton
        commands={commands}
        cId={OutputCommandIds.filter}
        icon={<IconFilter />}
      />
      <Divider orientation="vertical" />
      <UseSignal signal={commands.commandChanged}>
        {() => <AggregateGroupPopup cell={cell} commands={commands} />}
      </UseSignal>
      {/* <Box> */}
      {/*   <Switch */}
      {/*     label="Show pre-aggregate points" */}
      {/*     checked={showAggregateOriginal.get()} */}
      {/*     onChange={e => showAggregateOriginal.set(e.currentTarget.checked)} */}
      {/*   /> */}
      {/* </Box> */}
      <Divider orientation="vertical" />
      <Button.Group>
        <AddCategoryPopup cell={cell} />
        <UseSignal signal={commands.commandChanged}>
          {() => <AssignCategoryPopup cell={cell} commands={commands} />}
        </UseSignal>
      </Button.Group>
      <Divider orientation="vertical" />
      <Button.Group>
        <CommandButton
          commands={commands}
          cId={OutputCommandIds.labelSelection}
          icon={<IconTags />}
        />
        <CommandButton
          commands={commands}
          cId={OutputCommandIds.addNote}
          icon={<IconNotes />}
        />
      </Button.Group>
      <Divider orientation="vertical" />
      <Button.Group>
        <UseSignal signal={commands.commandChanged}>
          {() => <CopyDFPopup cell={cell} commands={commands} />}
        </UseSignal>
      </Button.Group>
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

  async associateCell(cell: TrrackableCell) {
    this.show();
    this.render();
    await this.renderPromise;

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
