import { createRender } from '@anywidget/react';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import React from 'react';
import { CommandRegistry } from '@lumino/commands';
import { TrrackableCell } from '../../cells';
import { withTrrackableCell } from '../utils/useCell';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { CommandArgMap, PersistCommands } from '../../commands';
import { UseSignal } from '@jupyterlab/apputils';
import { IconRefresh } from '@tabler/icons-react';

type Props = {
  cell: TrrackableCell;
};

function Header({ cell }: Props) {
  return (
    <Group
      sx={{
        borderBottom: '2px solid rgb(0, 0, 0, 10%)'
      }}
    >
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.resetTrrack}
      />
    </Group>
  );
}

export const render = createRender(withTrrackableCell(Header));

function CommandButton<K extends keyof CommandArgMap = keyof CommandArgMap>({
  cell,
  commandId,
  commandRegistry,
  commandArgs
}: {
  cell: TrrackableCell;
  commandRegistry: CommandRegistry;
  commandId: K;
  commandArgs?: CommandArgMap[K];
}) {
  if (!commandRegistry || !commandRegistry.hasCommand(commandId)) {
    if (!commandRegistry) {
      console.warn('Command registry not found');
    } else {
      console.warn(`Command ${commandId} not found in registry`);
    }
    return null;
  }

  const args = (commandArgs
    ? commandArgs
    : { cell }) as unknown as ReadonlyPartialJSONObject;

  return (
    <UseSignal signal={commandRegistry.commandChanged}>
      {() => {
        const isEnabled = commandRegistry.isEnabled(commandId, args);

        return (
          <Tooltip.Floating label={commandId}>
            <ActionIcon
              variant={isEnabled ? 'subtle' : 'transparent'}
              disabled={!isEnabled}
              onClick={() => commandRegistry.execute(commandId, args)}
            >
              <IconRefresh />
            </ActionIcon>
          </Tooltip.Floating>
        );
      }}
    </UseSignal>
  );
}
