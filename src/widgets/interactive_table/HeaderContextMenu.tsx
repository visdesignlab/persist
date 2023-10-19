import React from 'react';
import { Menu } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconTrash } from '@tabler/icons-react';
import { EditPopover } from './EditPopover';
import { TypeChangePopover } from './TypeChangePopover';

export function HeaderContextMenu({
  name,
  currentType,
  deleteColCallback,
  renameColCallback,
  editColTypeCallback,
  sortColCallback
}: {
  name: string;
  currentType: string;
  deleteColCallback: (s: string, e: React.MouseEvent) => void;
  sortColCallback: (asc: boolean) => void;
  editColTypeCallback: (
    newType: string,
    column: string,
    e: React.MouseEvent
  ) => void;
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
        icon={<IconTrash size={14} />}
      >
        Delete column
      </Menu.Item>
      <Menu.Item
        onClick={e => sortColCallback(true)}
        icon={<IconArrowUp size={14} />}
      >
        Sort ascending
      </Menu.Item>
      <Menu.Item
        onClick={e => sortColCallback(false)}
        icon={<IconArrowDown size={14} />}
      >
        Sort descending
      </Menu.Item>
      <TypeChangePopover
        col={name}
        onSubmit={editColTypeCallback}
        currentType={currentType}
      />
    </Menu.Dropdown>
  );
}
