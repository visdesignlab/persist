import React from 'react';
import { Popover, Button, TextInput, Stack, Group, Menu } from '@mantine/core';
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
    <Popover
      withinPortal
      position="right-start"
      width={200}
      trapFocus
      withArrow
      shadow="md"
    >
      <Popover.Target>
        <Menu.Item
          disabled={col === 'index'}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
          leftSection={<IconEdit size={14} />}
        >
          Rename column
        </Menu.Item>
      </Popover.Target>
      <Popover.Dropdown
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Stack
          gap="xs"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <TextInput
            value={newColName}
            onChange={event => setNewColName(event.currentTarget.value)}
            label={`Rename ${col}`}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            placeholder=""
            size="xs"
          />
          <Group justify="flex-end">
            <Button
              size="compact-mdp"
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
