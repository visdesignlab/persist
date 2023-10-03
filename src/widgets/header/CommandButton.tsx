import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { TrrackableCell } from '../../cells';

import { CommandArgMap } from '../../commands';
import React, { ReactNode } from 'react';
import { UseSignal } from '@jupyterlab/apputils';
import { ActionIcon, Tooltip } from '@mantine/core';
export function CommandButton<
  K extends keyof CommandArgMap = keyof CommandArgMap
>({
  cell,
  commandId,
  commandRegistry,
  commandArgs,
  icon
}: {
  cell: TrrackableCell;
  commandRegistry: CommandRegistry;
  commandId: K;
  commandArgs?: Omit<CommandArgMap[K], 'cell'>;
  icon: ReactNode;
}) {
  if (!commandRegistry || !commandRegistry.hasCommand(commandId)) {
    if (!commandRegistry) {
      console.warn('Command registry not found');
    } else {
      console.warn(`Command ${commandId} not found in registry`);
    }
    return null;
  }

  return (
    <UseSignal signal={commandRegistry.commandChanged}>
      {() => {
        const args = (commandArgs
          ? { ...commandArgs, cell }
          : { cell }) as unknown as ReadonlyPartialJSONObject;

        const isEnabled = commandRegistry.isEnabled(commandId, args);
        const label = commandRegistry.label(commandId, args) || commandId;

        return (
          <Tooltip.Floating label={label} offset={20}>
            <ActionIcon
              variant={isEnabled ? 'subtle' : 'transparent'}
              disabled={!isEnabled}
              onClick={() => commandRegistry.execute(commandId, args)}
            >
              {icon}
            </ActionIcon>
          </Tooltip.Floating>
        );
      }}
    </UseSignal>
  );
}
