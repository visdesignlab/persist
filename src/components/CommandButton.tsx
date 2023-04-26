import { UseSignal } from '@jupyterlab/apputils';
import { Button } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { ReadonlyJSONValue } from '@lumino/coreutils';
import React from 'react';

const OUTPUT_HEADER_BTN_CLASS = 'jp-OutputHeaderWidget-btn';

export type CommandButtonProps<CR extends CommandRegistry = CommandRegistry> = {
  commands: CR;
  cId: string;
  cArgs?: ReadonlyJSONValue;
  bIcon?: string;
  label?: string;
};

export function CommandButton(props: CommandButtonProps) {
  const { commands, cId } = props;

  if (!commands.hasCommand(cId)) {
    console.warn(`Command ${cId} not found`);
    return null;
  }

  return (
    <UseSignal signal={commands.commandChanged}>
      {() => (
        <Button
          className={OUTPUT_HEADER_BTN_CLASS}
          disabled={!commands.isEnabled(cId)}
          onClick={() => commands.execute(cId)}
        >
          {commands.label(cId)}
        </Button>
      )}
    </UseSignal>
  );
}
