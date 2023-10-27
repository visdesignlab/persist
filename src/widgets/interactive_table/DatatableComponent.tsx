import { Checkbox, Divider, Group, Stack, Table, Text } from '@mantine/core';
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
import { TABLE_FONT_SIZE } from './constants';
import {
  IconPlayerPlayFilled,
  IconPlayerTrackPrevFilled
} from '@tabler/icons-react';
import { IconPlayerTrackNextFilled } from '@tabler/icons-react';
import { HeaderActionIcon } from '../header/StyledActionIcon';

export type Data = Array<Record<string, any>>;

export function DatatableComponent({ cell }: { cell: TrrackableCell }) {
  const [data] = useModelState<Data>('df_values');
  const [df_columns] = useModelState<string[]>('df_non_meta_columns');
  const [dfColumnDtypes] =
    useModelState<Record<string, string>>('df_column_dtypes');
  console.log({ dfColumnDtypes });

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

  // Get all columns
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

  // Get checkbox column
  const fullCols = useMemo(() => {
    return [
      {
        id: 'select',
        header: ({ table }: { table: any }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            size="xs"
          />
        ),
        cell: ({ row }: { row: any }) => (
          <Checkbox
            checked={row.getIsSelected()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
            size="xs"
          />
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
    enableColumnResizing: true,
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
      <Stack gap={5}>
        <Table.ScrollContainer minWidth={700}>
          <Table
            style={{
              // width: table.getTotalSize(),
              borderCollapse: 'collapse'
            }}
            highlightOnHover
            withRowBorders={false}
            striped
          >
            <Table.Thead>
              {table.getHeaderGroups().map(headerGroup => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <Table.Th
                      key={header.id}
                      style={{
                        width: header.getSize()
                      }}
                      colSpan={header.colSpan}
                      w={`${header.getSize()}px`}
                      maw={`${header.getSize()}px`}
                      px="5px"
                      py="15px"
                      pr="0px"
                      pb="1px"
                    >
                      {header.isPlaceholder ? null : (
                        <Group
                          style={{ cursor: 'pointer' }}
                          onClick={header.column.getToggleSortingHandler()}
                          wrap="nowrap"
                          justify="flex-start"
                          gap={1}
                        >
                          <DraggableColumnHeader
                            key={header.id}
                            header={header}
                            table={table}
                            cell={cell}
                          />
                        </Group>
                      )}
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Td
                  m="0"
                  p="0"
                  py="0.5em"
                  colSpan={df_columns.length + 1}
                >
                  <Divider />
                </Table.Td>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map(row => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <Table.Td
                      w={`${cell.column.getSize()}px`}
                      maw={`${cell.column.getSize()}px`}
                      px="5px"
                      py="15px"
                      pr="0"
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Group>
          <HeaderActionIcon
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            radius="md"
            size="xs"
          >
            <IconPlayerTrackPrevFilled />
          </HeaderActionIcon>
          <HeaderActionIcon
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            radius="md"
            size="xs"
          >
            <IconPlayerPlayFilled transform="rotate(180)" />
          </HeaderActionIcon>
          <HeaderActionIcon
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            radius="md"
            size="xs"
          >
            <IconPlayerPlayFilled />
          </HeaderActionIcon>
          <HeaderActionIcon
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            radius="md"
            size="xs"
          >
            <IconPlayerTrackNextFilled />
          </HeaderActionIcon>
          <Text fz={TABLE_FONT_SIZE}>
            {`Showing ${
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1
            } - ${
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              table.getRowModel().rows.length
            } of ${data.length} entries`}
          </Text>
        </Group>
      </Stack>
    </DndProvider>
  );
}
