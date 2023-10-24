import {
  ActionIcon,
  Checkbox,
  Divider,
  Group,
  Stack,
  Text
} from '@mantine/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { isEqual } from 'lodash';

export type Data = Array<Record<string, any>>;

export function DatatableComponent({ cell }: { cell: TrrackableCell }) {
  const [data] = useModelState<Data>('df_values');
  const [df_columns] = useModelState<string[]>('df_non_meta_columns');

  // Selections
  const [rowSelectionArr] = useModelState<Array<number>>('df_selected_ids');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  useEffect(() => {
    const keys = Object.keys(rowSelection);

    if (!isEqual(keys, rowSelectionArr)) {
      const arr = Object.fromEntries(rowSelectionArr.map(r => [r - 1, true]));
      setRowSelection(arr);
    }
  }, [rowSelectionArr]);

  const [sortStatus] = useModelState<TableSortStatus>('df_column_sort_status');
  const columns = useColumnDefs(cell, df_columns);

  const sortCallback = useCallback(
    (sort: (s: SortingState) => SortingState) => {
      const allSort: { id: string; desc: boolean }[] = sort(
        sortStatus.map(s => ({
          id: s.column,
          desc: s.direction === 'desc'
        }))
      );

      if (allSort.length === 0) {
        // invert here
        allSort.push(
          ...sortStatus.map(s => ({
            id: s.column,
            desc: s.direction === 'asc'
          }))
        );
      }

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
      sorting: sortStatus.map(s => ({
        desc: s.direction === 'desc',
        id: s.column
      })),
      columnOrder: ['select', ...columns.map(col => col.id!)]
    },
    getRowId: row => row.index,
    autoResetPageIndex: false,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onSortingChange: sortCallback as any,
    onRowSelectionChange: (rows: Updater<RowSelectionState>) => {
      const selected = typeof rows === 'function' ? rows(rowSelection) : rows;

      const selectedIndices = Object.entries(selected)
        .filter(([_, sel]) => sel)
        .map(([k, _]) => (isNaN(parseInt(k)) ? k : parseInt(k) + 1));

      const id_col_name = '__id_column';

      const selectionArgs: SelectionCommandArgs = {
        cell,
        name: 'index_selection',
        store: selectedIndices.map(sel => ({
          field: id_col_name,
          channel: 'y',
          type: 'E',
          values: [sel]
        })),
        value: selectedIndices.map(sel => ({
          [id_col_name]: sel
        })),
        brush_type: 'point'
      };

      window.Persist.Commands.execute(
        PersistCommands.pointSelection,
        selectionArgs
      );
      setRowSelection(selected);
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
