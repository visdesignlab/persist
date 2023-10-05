import { createRender, useModel } from '@anywidget/react';
import React, { useEffect } from 'react';
import { TrrackableCell } from '../../cells';
import { withTrrackableCell } from '../utils/useCell';
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
import { AddCategoryPopover } from './AddCategoryPopover';
import { AssignCategoryPopover } from './AssignCategoryPopover';
import { CopyDFPopover } from './CopyDFPopover';

type Props = {
  cell: TrrackableCell;
};

function Header({ cell }: Props) {
  const model = useModel();

  useEffect(() => {
    const msgId = 'msg:custom';
    function generated(message: any) {
      console.log({ message });
    }

    model.on(msgId, generated);

    return () => {
      model.off(msgId, generated);
    };
  }, [model]);

  return (
    <Group
      sx={{
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
      <AddCategoryPopover cell={cell} />
      <AssignCategoryPopover cell={cell} />
      <Divider orientation="vertical" />
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.filterOut}
        icon={<IconFilterMinus />}
        commandArgs={{
          direction: 'out'
        }}
      />
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.filterIn}
        icon={<IconFilterPlus />}
        commandArgs={{
          direction: 'in'
        }}
      />
      <Divider orientation="vertical" />
      <Divider orientation="vertical" />
      <UseSignal signal={window.Persist.Commands.registry.commandChanged}>
        {() => <Annotate cell={cell} />}
      </UseSignal>
      <Divider orientation="vertical" />
      <CopyDFPopover cell={cell} />
    </Group>
  );
}

export const render = createRender(withTrrackableCell(Header));