import { UUID } from '@lumino/coreutils';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Popover,
  Stack,
  Text
} from '@mantine/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TrrackableCell, getDataframeCode } from '../../cells';
import { getInteractionsFromRoot } from '../../interactions/helpers';
import { Interactions } from '../../interactions/types';
import { Executor } from '../../notebook';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { DraggableColumnHeader } from './DraggableColumnHeader';

export function DatatableComponent({
  data,
  originalData,
  columns,
  cell,
  onUpdate
}: {
  data: Record<string, any>[];
  originalData: Record<string, any>[] | null;
  columns: ColumnDef<Record<string, any>, any>[];
  cell: TrrackableCell | null | undefined;
  onUpdate: (data: Record<string, any>[]) => void;
}) {
  const [filterText, setFilterText] = React.useState('');
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const [currCols, setCurrCols] = useState<string[]>([]);

  const [sorting, setSorting] = React.useState<SortingState>([]);

  useEffect(() => {
    if (!cell) {
      return;
    }

    // assigned to a var for cleanup
    const fn = (_: unknown, __: unknown) => {
      if (!originalData) {
        return null;
      }
      const interactions = getInteractionsFromRoot(cell.trrackManager);

      const result = Executor.execute(
        getDataframeCode('_temp_for_datatable', originalData, interactions)
      );

      result.then(result => {
        console.log(result);
        if (result.status === 'ok') {
          onUpdate(result.result);
        }
      });
    };

    cell.trrackManager.currentChange.connect(fn, cell);
    return () => {
      cell.trrackManager.currentChange.disconnect(fn, cell);
    };
  }, [cell]);

  const filteredItems = data.filter(item =>
    Object.values(item).find(val =>
      val?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const selectedCallback = useCallback(
    (rows: Record<string, any>) => {
      console.log(rows);
      if (cell) {
        const selection: Interactions.SelectionAction = {
          name: 'brush',
          select: { type: 'point' },
          id: UUID.uuid4(),
          type: 'selection',
          selected: {
            encodingTypes: {},
            value: Object.keys(rows).map((row: string) => {
              const { __selected, ...val } = data[+row];
              console.log(val);
              return val;
            })
          },
          views: []
        };

        cell.trrackManager.actions.addSelection(
          selection as any,
          () => `Select ${Object.keys(rows).length} point(s)`
        );
      }
    },
    [cell, data]
  );

  const sortCallback = useCallback(
    (sort: (s: SortingState) => SortingState) => {
      const allSort: { id: string; desc: boolean }[] = sort(sorting);

      const newSort = allSort[0];

      setSorting(sort);

      if (cell) {
        const sort: Interactions.SortAction = {
          id: UUID.uuid4(),
          type: 'sort',
          col: newSort.id as string,
          direction: !newSort.desc ? 'ascending' : 'descending'
        };

        cell.trrackManager.actions.sort(
          sort as any,
          () =>
            `Sort by ${newSort.id} ${
              !newSort.desc ? 'ascending' : 'descending'
            }`
        );
      }
    },
    [sorting]
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

  const rowSelection = useMemo(() => {
    const newMap: Record<string, boolean> = {};
    data.forEach((d, i) => {
      if (d['__selected']) {
        newMap[i.toString()] = true;
      }
    });

    return newMap;
  }, [data]);

  const table = useReactTable({
    state: {
      rowSelection,
      columnOrder: ['select', ...columns.map(col => col.id!)]
    },
    getRowId: row => row.index,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onSortingChange: sortCallback as any,
    onRowSelectionChange: ((rows: (old: any) => Record<string, boolean>) => {
      const newSelection = rows(rowSelection);

      console.log(rowSelection);

      selectedCallback(newSelection);
    }) as any,
    columnResizeMode: 'onChange',
    onColumnOrderChange: order => {
      if (cell) {
        const reorder: Interactions.ReorderAction = {
          id: UUID.uuid4(),
          type: 'reorder',
          value: order as string[]
        };

        cell.trrackManager.actions.reorder(
          reorder as any,
          () => 'Reorder columns'
        );
      }
    },
    data,
    columns: fullCols,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
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
                          cell={cell!}
                          key={header.id}
                          header={header}
                          table={table}
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
  );
}
