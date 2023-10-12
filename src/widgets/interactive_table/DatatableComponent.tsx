import {
  ActionIcon,
  Checkbox,
  Divider,
  Group,
  Stack,
  Text
} from '@mantine/core';
import React, { useCallback, useMemo } from 'react';
import { TrrackableCell } from '../../cells';
import {
  RowSelectionState,
  SortingState,
  Updater,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { DraggableColumnHeader } from './DraggableColumnHeader';
import { useModelState } from '@anywidget/react';
import { useColumnDefs } from './helpers';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SelectionCommandArgs } from '../../interactions/selection';
import { PersistCommands } from '../../commands';
import { TableSortStatus } from '../../interactions/sortByColumn';

export type Data = Array<Record<string, any>>;

export function DatatableComponent({ cell }: { cell: TrrackableCell }) {
  const [data] = useModelState<Data>('df_values');
  const [df_columns] = useModelState<string[]>('df_non_meta_columns');
  const [rowSelection] = useModelState<RowSelectionState>(
    'df_selection_status'
  );
  const [sortStatus = []] = useModelState<TableSortStatus>('df_sort_status');
  const columns = useColumnDefs(cell, df_columns);

  const sortCallback = useCallback(
    (sort: (s: SortingState) => SortingState) => {
      const allSort: { id: string; desc: boolean }[] = sort(
        sortStatus.map(s => ({
          id: s.column,
          desc: s.direction === 'desc'
        }))
      );

      window.Persist.Commands.execute(PersistCommands.sortByColumn, {
        cell,
        sortStatus: allSort.map(s => ({
          column: s.id,
          direction: s.desc ? 'desc' : 'asc'
        }))
      });
    },
    [sortStatus]
  );

  const fullCols = useMemo(() => {
    return [
      {
        id: 'select',
        header: ({ table }: { table: any }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }: { row: any }) => (
          <div className="px-1">
            <Checkbox
              checked={row.getIsSelected()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
        size: 30
      },
      ...columns
    ];
  }, [columns]);

  const table = useReactTable({
    state: {
      rowSelection,
      columnOrder: ['select', ...columns.map(col => col.id!)]
    },
    getRowId: row => row.index,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onSortingChange: sortCallback as any,
    onRowSelectionChange: (rows: Updater<RowSelectionState>) => {
      const selected = typeof rows === 'function' ? rows(rowSelection) : rows;

      const selectedIndices = Object.entries(selected)
        .filter(([_, sel]) => sel)
        .map(([k, _]) => (isNaN(parseInt(k)) ? k : parseInt(k)));

      const selectionArgs: SelectionCommandArgs = {
        cell,
        name: 'index_selection',
        store: selectedIndices.map(sel => ({
          field: 'index',
          channel: 'y',
          type: 'E',
          values: [sel]
        })),
        value: selectedIndices.map(sel => ({
          index: sel
        }))
      };

      console.log(selectionArgs);

      window.Persist.Commands.execute(
        PersistCommands.pointSelection,
        selectionArgs
      );
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: order => {
      window.Persist.Commands.execute(PersistCommands.reorderColumns, {
        cell,
        columns: typeof order === 'function' ? order([]) : order
      });
    },
    data,
    columns: fullCols,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <Stack spacing={5}>
        <table
          style={{ width: table.getTotalSize(), borderCollapse: 'collapse' }}
        >
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize()
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        style={{ cursor: 'pointer' }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <Group
                          noWrap
                          position="left"
                          spacing={1}
                          style={{ width: header.getSize() }}
                          py={'5px'}
                          px={'2px'}
                          mx={'2px'}
                        >
                          <DraggableColumnHeader
                            key={header.id}
                            header={header}
                            table={table}
                            cell={cell}
                          />
                          <Group
                            position="center"
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onClick={e => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            style={{
                              width: '10px',
                              minWidth: '10px',
                              height: '25px',
                              cursor: 'col-resize'
                            }}
                          >
                            <Divider
                              style={{ height: '100%' }}
                              orientation="vertical"
                            ></Divider>
                          </Group>
                        </Group>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                style={{
                  borderBottom: '1px solid lightgray'
                }}
                key={row.id}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    style={{
                      width: `${cell.column.getSize()}px`,
                      maxWidth: `${cell.column.getSize()}px`,
                      paddingLeft: '5px',
                      paddingRight: '5px',
                      paddingTop: '15px',
                      paddingBottom: '15px'
                    }}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Group position="left">
          <ActionIcon
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <Text>{'<<'}</Text>
          </ActionIcon>
          <ActionIcon
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Text>{'<'}</Text>
          </ActionIcon>
          <ActionIcon
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <Text>{'>'}</Text>
          </ActionIcon>
          <ActionIcon
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <Text>{'>>'}</Text>
          </ActionIcon>
          <Text>{`Showing ${
            table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
            1
          } - ${
            table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
            table.getRowModel().rows.length
          } of ${data.length} entries`}</Text>
        </Group>
      </Stack>
    </DndProvider>
  );
}
