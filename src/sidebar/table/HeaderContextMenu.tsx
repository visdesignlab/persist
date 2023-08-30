import { Menu } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useEffect } from 'react';
import { EditPopover } from './EditPopover';

export function HeaderContextMenu({
  name,
  deleteColCallback,
  renameColCallback,
  closeCallback
}: {
  name: string;
  deleteColCallback: (s: string, e: React.MouseEvent) => void;
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
        console.log(e);
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <EditPopover col={name} onSubmit={renameColCallback} />
      <Menu.Item
        onClick={e => deleteColCallback(name, e)}
        icon={<IconTrash size={14} />}
      >
        Delete column
      </Menu.Item>
    </Menu.Dropdown>
  );
}
