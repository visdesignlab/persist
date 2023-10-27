import React from 'react';
import { Menu } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconTrash } from '@tabler/icons-react';
import { EditPopover } from './EditPopover';

export function HeaderContextMenu({
  name,
  deleteColCallback,
  renameColCallback,
  sortColCallback
}: {
  name: string;
  deleteColCallback: (s: string, e: React.MouseEvent) => void;
  sortColCallback: (asc: boolean) => void;
  renameColCallback: (
    oldName: string,
    newName: string,
    e: React.MouseEvent
  ) => void;
  closeCallback: () => void;
}) {
  return (
    <Menu.Dropdown
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <EditPopover col={name} onSubmit={renameColCallback} />
      <Menu.Item
        disabled={name === 'index'}
        onClick={e => deleteColCallback(name, e)}
        leftSection={<IconTrash size={14} />}
      >
        Delete column
      </Menu.Item>
      <Menu.Item
        onClick={() => sortColCallback(true)}
        leftSection={<IconArrowUp size={14} />}
      >
        Sort ascending
      </Menu.Item>
      <Menu.Item
        onClick={() => sortColCallback(false)}
        leftSection={<IconArrowDown size={14} />}
      >
        Sort descending
      </Menu.Item>
    </Menu.Dropdown>
  );
}
