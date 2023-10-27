import React, { useMemo } from 'react';
import { TrrackableCell } from '../../cells';
import { ColumnDef, createColumnHelper } from '@tanstack/table-core';
import { Text, Tooltip } from '@mantine/core';
import { RowValue } from './RowValue';
import { TABLE_FONT_SIZE } from './constants';

export function useColumnDefs(
  cell: TrrackableCell,
  columns: string[],
  toFilter: string[] = []
): ColumnDef<Record<string, any>, any>[] {
  return useMemo(() => {
    const columnHelper = createColumnHelper<Record<string, any>>();

    return columns
      .filter(col => !toFilter.includes(col))
      .map(key =>
        columnHelper.accessor(key, {
          id: key,
          maxSize: 200,
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
            <Tooltip label={key} withArrow color="gray" opacity={0.8}>
              <Text
                style={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
                w="100%"
                ta="right"
                fw="bold"
                fz={TABLE_FONT_SIZE}
              >
                {key}
              </Text>
            </Tooltip>
          )
        })
      );
  }, [cell, columns, toFilter]);
}
