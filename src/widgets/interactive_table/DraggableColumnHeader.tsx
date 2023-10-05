import { useDrag, useDrop } from 'react-dnd';
import React from 'react';

import {
  Column,
  ColumnOrderState,
  Header,
  Table,
  flexRender
} from '@tanstack/react-table';
import { Group, Menu } from '@mantine/core';
import { useCallback, useState } from 'react';
import { HeaderContextMenu } from './HeaderContextMenu';
import { PersistCommands } from '../../commands';
import { TrrackableCell } from '../../cells';
import { useModelState } from '@anywidget/react';
import { TableSortStatus } from '../../interactions/sortByColumn';

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
  const [sortStatus = []] = useModelState<TableSortStatus>('df_sort_status');

  const [openContextMenu, setOpenContextMenu] = useState<boolean>(false);

  const [, dropRef] = useDrop({
    accept: 'column',
    drop: (draggedColumn: Column<any>) => {
      const newColumnOrder = reorderColumn(
        draggedColumn.id,
        column.id,
        columnOrder
      );

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

  const sortCallback = useCallback(
    (asc: boolean) => {
      window.Persist.Commands.execute(PersistCommands.sortByColumn, {
        cell,
        sortStatus: [
          {
            column: column.id,
            direction: asc ? 'asc' : 'desc'
          }
        ]
      });

      setOpenContextMenu(false);
    },
    [column]
  );

  const deleteColCallback = useCallback(
    (colToDelete: string, e: React.MouseEvent) => {
      if (colToDelete === 'index') {
        return;
      }
      window.Persist.Commands.execute(PersistCommands.dropColumns, {
        cell,
        columns: [colToDelete]
      });

      e.stopPropagation();
      e.preventDefault();
    },
    []
  );

  const editColCallback = useCallback(
    (colToEdit: string, newName: string, e: React.MouseEvent) => {
      window.Persist.Commands.execute(PersistCommands.renameColumns, {
        cell,
        newColumnName: newName,
        previousColumnName: colToEdit
      });

      e.stopPropagation();
      e.preventDefault();
    },
    []
  );

  const sorted =
    sortStatus.filter(s => s.column === header.column.id)[0]?.direction ?? null;

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
            style={{ width: header.column.getSize() - 10 }}
            ref={dragRef}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
            {sorted &&
              {
                asc: ' ⌃',
                desc: ' ⌄'
              }[sorted]}
          </Group>
        </Menu.Target>
        <HeaderContextMenu
          renameColCallback={editColCallback}
          sortColCallback={sortCallback}
          closeCallback={() => setOpenContextMenu(false)}
          deleteColCallback={deleteColCallback}
          name={header.column.id}
        />
      </Menu>
    </th>
  );
}
