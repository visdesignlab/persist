import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import React from 'react';
import {
  ActionIcon,
  Button,
  Center,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core';
import { useDisclosure, useValidatedState } from '@mantine/hooks';
import { IconEdit } from '@tabler/icons-react';
import { useState } from 'react';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';
import { RenameColumnCommandArgs } from '../../interactions/renameColumn';
import { useModelState } from '@anywidget/react';

type Props = {
  cell: TrrackableCell;
};

export function RenameColumnPopover({ cell }: Props) {
  const [opened, openHandlers] = useDisclosure(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [columns = []] = useModelState<string[]>('df_columns');
  const [newName, setNewName] = useValidatedState(
    '',
    val => !columns.includes(val),
    true
  );

  const columnObject = columns.map(col => ({
    label: col,
    value: col
  }));

  return (
    <Popover
      opened={opened}
      onChange={openHandlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon onClick={() => openHandlers.toggle()}>
          <Tooltip.Floating label="Rename Column" offset={20}>
            <IconEdit />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Center w={300} mt="sm" mb="md">
          <Stack>
            <Title order={4}>Rename Column</Title>
            <Select
              data={columnObject}
              value={activeColumn}
              onChange={setActiveColumn}
              placeholder="Select a column to rename"
              searchable
            />
            <TextInput
              w={300}
              disabled={Boolean(
                !activeColumn || !columns.includes(activeColumn)
              )}
              error={!newName.valid}
              placeholder={`Enter new column name (no spaces) for ${activeColumn}`}
              value={newName.value}
              onChange={e =>
                setNewName(e.currentTarget.value.replace(' ', '_'))
              }
            />
            {!newName.valid && newName.value.length > 0 && (
              <Text size="sm" mt="md" sx={{ overflowWrap: 'normal' }}>
                Column name {newName.value} already exists in the dataset.
              </Text>
            )}
            <Button
              disabled={
                !activeColumn || !newName.valid || newName.value.length === 0
              }
              onClick={async () => {
                if (
                  !activeColumn ||
                  !newName.valid ||
                  newName.value.length === 0
                ) {
                  return;
                }

                const args: RenameColumnCommandArgs = {
                  cell,
                  previousColumnName: activeColumn,
                  newColumnName: newName.value
                };

                window.Persist.Commands.registry.execute(
                  PersistCommands.renameColumns,
                  args as unknown as ReadonlyPartialJSONObject
                );
                setActiveColumn(null);
                setNewName('');
                openHandlers.close();
              }}
            >
              Rename
            </Button>
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}