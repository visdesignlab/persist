import { useDrag, useDrop } from 'react-dnd';

import {
  Column,
  ColumnOrderState,
  Header,
  Table,
  flexRender
} from '@tanstack/react-table';
import { Group, Menu } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { TrrackableCell } from '../../cells';
import { Interactions } from '../../interactions/types';
import { UUID } from '@lumino/coreutils';
import { HeaderContextMenu } from './HeaderContextMenu';

const reorderColumn = (
  draggedColumnId: string,
  targetColumnId: string,
  columnOrder: string[]
): ColumnOrderState => {
  columnOrder.splice(
    columnOrder.indexOf(targetColumnId),
    0,
    columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
  );
  return [...columnOrder];
};

export function DraggableColumnHeader({
  header,
  table,
  cell
}: {
  header: Header<any, unknown>;
  table: Table<any>;
  cell: TrrackableCell;
}) {
  const { getState, setColumnOrder } = table;
  const { columnOrder } = getState();
  const { column } = header;

  const [openContextMenu, setOpenContextMenu] = useState<boolean>(false);

  const [, dropRef] = useDrop({
    accept: 'column',
    drop: (draggedColumn: Column<any>) => {
      console.log(draggedColumn, column, columnOrder);
      const newColumnOrder = reorderColumn(
        draggedColumn.id,
        column.id,
        columnOrder
      );

      console.log(newColumnOrder);
      setColumnOrder(newColumnOrder);
    }
  });

  const [{ isDragging }, dragRef] = useDrag({
    collect: monitor => ({
      isDragging: monitor.isDragging()
    }),
    item: () => column,
    type: 'column'
  });

  const deleteColCallback = useCallback(
    (colToDelete: string, e: React.MouseEvent) => {
      if (cell) {
        const drop: Interactions.DropColumnAction = {
          id: UUID.uuid4(),
          type: 'drop-columns',
          columnNames: [colToDelete]
        };

        cell.trrackManager.actions.addDropColumnInteraction(
          drop as any,
          () => `Remove column ${colToDelete}`
        );
      }

      e.stopPropagation();
      e.preventDefault();
    },
    []
  );

  const editColCallback = useCallback(
    (colToEdit: string, newName: string, e: React.MouseEvent) => {
      if (cell) {
        const drop: Interactions.RenameColumnAction = {
          id: UUID.uuid4(),
          type: 'rename-column',
          prevColumnName: colToEdit,
          newColumnName: newName
        };

        cell.trrackManager.actions.addDropColumnInteraction(
          drop as any,
          () => `Rename ${colToEdit} to ${newName}`
        );
      }

      e.stopPropagation();
      e.preventDefault();
    },
    []
  );

  return (
    <th
      ref={dropRef}
      colSpan={header.colSpan}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Menu
        closeOnItemClick={false}
        opened={openContextMenu}
        onClose={() => setOpenContextMenu(false)}
      >
        <Menu.Target>
          <Group
            onContextMenu={e => {
              e.preventDefault();
              e.stopPropagation();
              setOpenContextMenu(true);
            }}
            style={{ width: header.column.getSize() }}
            ref={dragRef}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </Group>
        </Menu.Target>
        <HeaderContextMenu
          renameColCallback={editColCallback}
          closeCallback={() => setOpenContextMenu(false)}
          deleteColCallback={deleteColCallback}
          name={header.column.id}
        />
      </Menu>
    </th>
  );
}
