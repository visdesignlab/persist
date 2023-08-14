import { UseSignal } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import { ReadonlyJSONValue } from '@lumino/coreutils';
import { ActionIcon, Tooltip } from '@mantine/core';
import { ReactNode } from 'react';

export type CommandButtonProps<CR extends CommandRegistry = CommandRegistry> = {
  commands: CR;
  cId: string;
  cArgs?: ReadonlyJSONValue;
  bIcon?: string;
  label?: string;
  icon: ReactNode;
  categories?: string[] | null;
  colorScale?: d3.ScaleOrdinal<string, string> | null;
  setCategories?: (s: string) => void;
  disabled?: boolean;
};

/**
 * refactor for brevity
 */

export function CommandButton(props: CommandButtonProps) {
  const { commands, cId } = props;

  if (!commands.hasCommand(cId)) {
    console.warn(`Command ${cId} not found`);
    return null;
  }

  return (
    <UseSignal signal={commands.commandChanged}>
      {() => (
        <Tooltip.Floating label={commands.label(cId)} offset={20}>
          <ActionIcon
            onClick={() => commands.execute(cId)}
            disabled={!commands.isEnabled(cId)}
            variant={!commands.isEnabled(cId) ? 'transparent' : 'subtle'}
          >
            {props.icon}
          </ActionIcon>
        </Tooltip.Floating>
      )}
    </UseSignal>
  );
}
