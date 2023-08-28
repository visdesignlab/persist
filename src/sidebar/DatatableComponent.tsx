import { TrrackableCell, getDataframeCode } from '../cells';
import DataTable, { Alignment } from 'react-data-table-component';
import React, { useCallback, useEffect } from 'react';
import { ISignal, Signal } from '@lumino/signaling';
import { TextInput } from '@mantine/core';
import { Interactions } from '../interactions/types';
import { UUID } from '@lumino/coreutils';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { Executor } from '../notebook';
import { useTimeout } from '@mantine/hooks';

export function DatatableComponent({
  data,
  originalData,
  columns,
  cell,
  onUpdate
}: {
  data: Record<string, any>[];
  originalData: Record<string, any>[] | null;
  columns: Record<string, any>[];
  cell: TrrackableCell | null | undefined;
  onUpdate: (data: Record<string, any>[]) => void;
}) {
  const [filterText, setFilterText] = React.useState('');

  useEffect(() => {
    cell?.trrackManager.currentChange.connect((_, __) => {
      if (!originalData) {
        return null;
      }
      const interactions = getInteractionsFromRoot(cell.trrackManager);

      console.log(interactions);

      const result = Executor.execute(
        getDataframeCode('_temp_for_datatable', originalData, interactions)
      );

      result.then(result => {
        console.log(result);

        if (result.status === 'ok') {
          onUpdate(result.result);
        }
      });
    }, cell);
  }, [cell]);

  const filteredItems = data.filter(item =>
    Object.values(item).find(val =>
      val?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const subHeaderComponentMemo = React.useMemo(() => {
    return (
      <TextInput
        label="Search"
        onChange={e => setFilterText(e.currentTarget.value)}
        value={filterText}
      />
    );
  }, [filterText]);

  const selectedCallback = useCallback(
    (rows: any) => {
      if (cell) {
        if (rows.selectedCount === cell.selectedRows.length) {
          return;
        }
        const selection: Interactions.SelectionAction = {
          name: 'brush',
          select: { type: 'point' },
          id: UUID.uuid4(),
          type: 'selection',
          value: rows.selectedRows.map((row: any) => {
            const { __selected, ...newRow } = row;

            return newRow;
          }),
          views: []
        };

        cell.trrackManager.actions.addSelection(
          selection as any,
          () => `Select ${rows.selectedCount} point(s)`
        );
      }
    },
    [cell]
  );

  console.log(columns);

  return (
    <DataTable
      customStyles={{
        pagination: {
          style: {
            marginTop: 'auto'
          }
        }
      }}
      selectableRows
      selectableRowSelected={row =>
        row.__selected || (row.__invert_selected && !row.__selected)
      }
      onSelectedRowsChange={selectedCallback}
      sortFunction={rows => rows}
      onSort={(col, sortedDirection) => {
        if (cell) {
          const sort: Interactions.SortAction = {
            id: UUID.uuid4(),
            type: 'sort',
            col: col.name as string,
            direction: sortedDirection === 'asc' ? 'ascending' : 'descending'
          };

          cell.trrackManager.actions.sort(
            sort as any,
            () =>
              `Sort by ${col.name} ${
                sortedDirection === 'asc' ? 'ascending' : 'descending'
              }`
          );
        }
      }}
      subHeader
      subHeaderAlign={Alignment.LEFT}
      subHeaderComponent={subHeaderComponentMemo}
      pagination
      responsive
      onColumnOrderChange={cols => {
        console.log(cols);
        if (cell) {
          const reorder: Interactions.ReorderAction = {
            id: UUID.uuid4(),
            type: 'reorder',
            value: cols.map(col => col.name as string)
          };

          cell.trrackManager.actions.reorder(
            reorder as any,
            () => 'Reorder columns'
          );
        }
      }}
      data={filteredItems.length > 0 ? filteredItems : data}
      columns={columns}
      paginationComponentOptions={{ noRowsPerPage: true }}
    />
  );
}
