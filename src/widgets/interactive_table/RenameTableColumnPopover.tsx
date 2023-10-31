import React, { useState } from 'react';
import { MRT_Column } from 'mantine-react-table';
import { DataPoint } from './helpers';
import {
  Text,
  Center,
  Stack,
  TextInput,
  Button,
  Menu,
  Popover
} from '@mantine/core';
import { TrrackableCell } from '../../cells';
import { useValidatedState } from '@mantine/hooks';
import { PersistCommands } from '../../commands';
import { IconEdit } from '@tabler/icons-react';

export type Props = {
  cell: TrrackableCell;
  open: boolean;
  onClose: () => void;
  column: MRT_Column<DataPoint>;
  allColumnNames: string[];
};

export function RenameTableColumnPopover({
  cell,
  column,
  allColumnNames
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useValidatedState(
    column.id,
    val => {
      return val.length > 0 && !allColumnNames.includes(val);
    },
    true
  );

  return (
    <Popover
      opened={open}
      position="right-start"
      trapFocus
      withArrow
      withinPortal={false}
      shadow="md"
      onClose={() => setOpen(false)}
    >
      <Popover.Target>
        <Menu.Item
          onClick={e => {
            setOpen(true);
            e.stopPropagation();
            e.preventDefault();
          }}
          icon={<IconEdit />}
        >
          Rename column '{column.id}'
        </Menu.Item>
      </Popover.Target>
      <Popover.Dropdown>
        <Center w={250} mt="sm" mb="md">
          <Stack spacing="xs">
            <TextInput
              w={250}
              error={!name.valid}
              placeholder={`Enter new column name for ${column.id}`}
              value={name.value}
              onChange={e => setName(e.target.value)}
            />

            {!name.valid && name.value.length > 0 && (
              <Text size="sm" mt="md" style={{ overflowWrap: 'normal' }}>
                Column name {name.value} already exists in the dataset.
              </Text>
            )}

            <Button
              disabled={!name.valid || name.value === column.id}
              onClick={() => {
                window.Persist.Commands.execute(PersistCommands.renameColumns, {
                  cell,
                  renameColumnMap: {
                    [column.id]: name.value
                  }
                });
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
