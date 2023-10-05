import { useModelState } from '@anywidget/react';
import React from 'react';
import {
  ActionIcon,
  Button,
  Center,
  Checkbox,
  Group,
  Popover,
  Stack,
  Title,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconColumnRemove } from '@tabler/icons-react';
import { useState } from 'react';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';
import { DropColumnsCommandArgs } from '../../interactions/dropColumn';

type Props = {
  cell: TrrackableCell;
};

export function DropColumnPopover({ cell }: Props) {
  const [opened, openHandlers] = useDisclosure(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columns = []] = useModelState<string[]>('df_columns');

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
          <Tooltip.Floating label="Drop Column" offset={20}>
            <IconColumnRemove />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Center w={300} mt="sm" mb="md">
          <Stack>
            <Title order={4}>Drop Columns</Title>
            <Checkbox.Group
              value={selectedColumns}
              onChange={setSelectedColumns}
            >
              <Group mt="xs">
                {columns.map(c => (
                  <Checkbox key={c} value={c} label={c} />
                ))}
              </Group>
            </Checkbox.Group>
            <Button
              disabled={selectedColumns.length === 0}
              onClick={async () => {
                const args: DropColumnsCommandArgs = {
                  cell,
                  columns: selectedColumns
                };

                window.Persist.Commands.execute(
                  PersistCommands.dropColumns,
                  args
                );
                setSelectedColumns([]);
                openHandlers.close();
              }}
            >
              Drop selected
            </Button>
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
