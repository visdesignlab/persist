import React from 'react';
import { Popover, Button, Stack, Group, Menu, Select } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { useState } from 'react';

export function TypeChangePopover({
  col,
  currentType,
  onSubmit
}: {
  col: string;
  currentType: string;
  onSubmit: (newType: string, column: string, e: React.MouseEvent) => void;
}) {
  const [value, setValue] = useState<string>(currentType);

  return (
    <Popover
      position="right-start"
      width={200}
      trapFocus
      withArrow
      shadow="md"
      onClose={() => console.log('closing')}
    >
      <Popover.Target>
        <Menu.Item
          disabled={col === 'index'}
          onClick={e => {
            console.log(e);
            e.stopPropagation();
            e.preventDefault();
          }}
          icon={<IconEdit size={14} />}
        >
          Change type
        </Menu.Item>
      </Popover.Target>
      <Popover.Dropdown
        style={{ pointerEvents: 'auto' }}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Stack
          spacing="xs"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Select
            value={value}
            clearable={false}
            onChange={v => setValue(v!)}
            label={`Change type of ${col}`}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            data={[
              'int64',
              'float64',
              'bool',
              'string',
              'object',
              'datetime64[ns]'
            ]}
            size="xs"
          />
          <Group position="right">
            <Button
              compact
              onClick={(e: React.MouseEvent) => onSubmit(value, col, e)}
            >
              Change Type
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
