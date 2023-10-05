import React from 'react';
import { TrrackableCell } from '../../cells';
import { ColumnDef, createColumnHelper } from '@tanstack/table-core';
import { Text } from '@mantine/core';
import { RowValue } from './RowValue';

export function useColumnDefs(
  cell: TrrackableCell,
  columns: string[],
  to_filter: string[] = []
): ColumnDef<Record<string, any>, any>[] {
  const columnHelper = createColumnHelper<Record<string, any>>();

  return columns
    .filter(col => !to_filter.includes(col))
    .map(key =>
      columnHelper.accessor(key, {
        id: key,
        size: 100,
        enableSorting: true,
        cell: info => (
          <RowValue
            val={info.getValue()}
            col={key}
            cell={cell}
            index={(+info.row.id || 1) - 1}
          />
        ),
        header: () => (
          <Text
            sx={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {key}
          </Text>
        )
      })
    );
}
