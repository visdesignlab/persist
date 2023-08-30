import {
  Popover,
  Button,
  TextInput,
  ActionIcon,
  Text,
  Stack,
  Group,
  Menu
} from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { useState } from 'react';

export function EditPopover({
  col,
  onSubmit
}: {
  col: string;
  onSubmit: (s: string, old: string, e: React.MouseEvent) => void;
}) {
  const [newColName, setNewColName] = useState<string>('');

  return (
    <Popover position="right-start" width={200} trapFocus withArrow shadow="md">
      <Popover.Target>
        <Menu.Item
          onClick={e => {
            console.log(e);
            e.stopPropagation();
            e.preventDefault();
          }}
          icon={<IconEdit size={14} />}
        >
          Rename column
        </Menu.Item>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack spacing="xs">
          <TextInput
            value={newColName}
            onChange={event => setNewColName(event.currentTarget.value)}
            label={`Rename ${col}`}
            placeholder=""
            size="xs"
          />
          <Group position="right">
            <Button
              compact
              onClick={(e: React.MouseEvent) => onSubmit(col, newColName, e)}
            >
              Rename
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
