import { TrrackableCell } from '../cells';
import DataTable, { Alignment } from 'react-data-table-component';
import React from 'react';
import { TextInput } from '@mantine/core';
import { Interactions } from '../interactions/types';
import { UUID } from '@lumino/coreutils';
import { objectKeys } from '../utils/objectKeys';

export function DatatableComponent({
  data,
  columns,
  cell
}: {
  data: Record<string, any>[];
  columns: Record<string, any>[];
  cell: TrrackableCell | null | undefined;
}) {
  const [filterText, setFilterText] = React.useState('');

  const filteredItems = data.filter(item =>
    Object.values(item).find(val =>
      val?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  console.log(filteredItems);

  const subHeaderComponentMemo = React.useMemo(() => {
    return (
      <TextInput
        label="Search"
        onChange={e => setFilterText(e.currentTarget.value)}
        value={filterText}
      />
    );
  }, [filterText]);

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
      onSelectedRowsChange={rows => {
        if (cell) {
          cell.selectedRows = rows.selectedRows;

          const values: Record<string, any> = {};

          columns.forEach(
            col => (values[col.name] = rows.selectedRows.map(d => d[col.name]))
          );

          const selection: Interactions.SelectionAction = {
            name: 'brush',
            select: { type: 'point' },
            id: UUID.uuid4(),
            type: 'selection',
            value: rows.selectedRows,
            views: []
          };

          cell.trrackManager.actions.addSelection(
            selection as any,
            () => `Select ${rows.selectedCount} point(s)`
          );
        }
      }}
      onSort={col => {
        if (cell) {
          const sort: Interactions.SortAction = {
            id: UUID.uuid4(),
            type: 'sort',
            col: col.name as string,
            direction: 'ascending'
          };

          cell.trrackManager.actions.sort(
            sort as any,
            () => `Sort by ${col.name}`
          );
        }
      }}
      subHeader
      subHeaderAlign={Alignment.LEFT}
      subHeaderComponent={subHeaderComponentMemo}
      pagination
      responsive
      data={filteredItems.length > 0 ? filteredItems : data}
      columns={columns}
      paginationComponentOptions={{ noRowsPerPage: true }}
    />
  );
}
