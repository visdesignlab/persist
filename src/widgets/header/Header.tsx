import { useModelState } from '@anywidget/react';
import React from 'react';
import { TrrackableCell } from '../../cells';
import { Divider, Group } from '@mantine/core';
import { PersistCommands } from '../../commands';
import {
  IconFilterMinus,
  IconFilterPlus,
  IconRefresh
} from '@tabler/icons-react';
import { CommandButton } from './CommandButton';
import { Annotate } from './Annotate';
import { UseSignal } from '@jupyterlab/apputils';
import { RenameColumnPopover } from './RenameColumnPopover';
import { DropColumnPopover } from './DropColumnPopover';
import { EditCategoryPopover } from './EditCategoryPopover';
import { AssignCategoryPopover } from './AssignCategoryPopover';
import { CopyDFPopover } from './CopyDFPopover';

type Props = {
  cell: TrrackableCell;
};

export function Header({ cell }: Props) {
  const [hasSelections] = useModelState<boolean>('df_has_selections');

  return (
    <Group
      style={{
        borderBottom: '2px solid rgb(0, 0, 0, 10%)',
        padding: '1em'
      }}
    >
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.resetTrrack}
        icon={<IconRefresh />}
      />
      <Divider orientation="vertical" />
      <RenameColumnPopover cell={cell} />
      <DropColumnPopover cell={cell} />
      <Divider orientation="vertical" />
      <EditCategoryPopover cell={cell} />
      <AssignCategoryPopover cell={cell} />
      <Divider orientation="vertical" />
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.filterOut}
        icon={<IconFilterMinus />}
        isDisabled={!hasSelections}
        commandArgs={{
          direction: 'out'
        }}
      />
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.filterIn}
        icon={<IconFilterPlus />}
        isDisabled={!hasSelections}
        commandArgs={{
          direction: 'in'
        }}
      />
      <Divider orientation="vertical" />
      <UseSignal signal={window.Persist.Commands.registry.commandChanged}>
        {() => <Annotate cell={cell} isDisabled={!hasSelections} />}
      </UseSignal>
      <Divider orientation="vertical" />
      <CopyDFPopover cell={cell} />
    </Group>
  );
}
