import React from 'react';
import {
  ActionIcon,
  Button,
  Popover,
  Stack,
  Textarea,
  Title,
  Tooltip
} from '@mantine/core';

import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { TrrackableCell } from '../../cells';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { IconNotes } from '@tabler/icons-react';
import { PersistCommands } from '../../commands';
import { AnnotateCommandArgs } from '../../interactions/annotate';

type Props = {
  cell: TrrackableCell;
};

export function Annotate({ cell }: Props) {
  const [opened, openHandlers] = useDisclosure(false);
  const [note, setNote] = useInputState('');

  const args: AnnotateCommandArgs = {
    cell,
    text: note
  };

  const isEnabled = window.Persist.Commands.registry.isEnabled(
    PersistCommands.annotate,
    args as unknown as ReadonlyPartialJSONObject
  );

  return (
    <Popover
      opened={opened}
      onChange={openHandlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon
          onClick={() => openHandlers.toggle()}
          variant={isEnabled ? 'subtle' : 'transparent'}
          disabled={!isEnabled}
        >
          <Tooltip.Floating label="Annotate" offset={20}>
            <IconNotes />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          <Title order={4}>Annotate selected items</Title>
          <Textarea
            value={note}
            onChange={setNote}
            placeholder="Enter your notes here..."
            label="Your annotations:"
            autosize
          />
          <Button
            disabled={!note.length}
            onClick={() => {
              // Annotate
              window.Persist.Commands.registry.execute(
                PersistCommands.annotate,
                args as unknown as ReadonlyPartialJSONObject
              );

              setNote('');
              openHandlers.close();
            }}
          >
            Annotate
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
