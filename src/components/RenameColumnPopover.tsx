import { CommandRegistry } from '@lumino/commands';
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
import { TrrackableCell } from '../cells';
import {
  OutputCommandIds,
  RenameColumnCommandArgs
} from '../cells/output/commands';
import { useDatasetFromVegaView } from '../vegaL/helpers';

type Props = {
  cell: TrrackableCell;

  commands: CommandRegistry;
};

export function RenameColumnPopover({ cell, commands }: Props) {
  const [opened, openHandlers] = useDisclosure(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const dataset = useDatasetFromVegaView(cell);

  const [newName, setNewName] = useValidatedState(
    '',
    val => !dataset.columns.includes(val),
    true
  );

  const columns = dataset.columns.map(col => ({
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
              data={columns}
              value={activeColumn}
              onChange={setActiveColumn}
              placeholder="Select a column to rename"
              searchable
            />
            <TextInput
              w={300}
              disabled={Boolean(
                !activeColumn || !dataset.columns.includes(activeColumn)
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
                  prevColumnName: activeColumn,
                  newColumnName: newName.value
                };

                await commands.execute(OutputCommandIds.renameColumn, args);
                setActiveColumn(null);
                setNewName('');
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
