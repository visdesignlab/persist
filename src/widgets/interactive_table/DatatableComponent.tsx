import React, { useMemo, useState } from 'react';
import { TrrackableCell } from '../../cells';
import {
  MRT_RowSelectionState,
  MantineReactTable,
  useMantineReactTable,
  MRT_ShowHideColumnsButton,
  type MRT_SortingState,
  MRT_ToggleFullScreenButton,
  MRT_ToggleFiltersButton
} from 'mantine-react-table';
import { useModelState } from '@anywidget/react';
import { Data, applyDTypeToValue, useColumnDefs } from './helpers';
import { PersistCommands } from '../../commands';
import { Box, Divider, Menu } from '@mantine/core';
import { IconDatabase, IconTrash } from '@tabler/icons-react';
import { Nullable } from '../../utils/nullable';
import { PERSIST_MANTINE_FONT_SIZE } from './constants';
import { DTypeContextMenu, PandasDTypes } from './DTypeContextMenu';
import { RenameTableColumnPopover } from './RenameTableColumnPopover';

type Props = {
  cell: TrrackableCell;
};

const MRT_Row_Selection = 'mrt-row-select';
const MRT_Row_Actions = 'mrt-row-actions';
const MRT_Row_Drag = 'mrt-row-drag';
const MRT_Row_Expand = 'mrt-row-expand';
const MRT_Row_Numbers = 'mrt-row-numbers';

const MRT_DisplayColumns = [
  MRT_Row_Selection,
  MRT_Row_Actions,
  MRT_Row_Drag,
  MRT_Row_Expand,
  MRT_Row_Numbers
];

export function DatatableComponent({ cell }: Props) {
  const [data] = useModelState<Data>('data_values');
  const [dfVisibleColumns] = useModelState<string[]>('df_columns_non_meta');
  const [ID_COLUMN] = useModelState<string>('id_column');
  const [rowSelection] = useModelState<MRT_RowSelectionState>(
    'df_row_selection_state'
  );

  const [open, setOpen] = useState(true);
  const [sorting] = useModelState<MRT_SortingState>('df_sorting_state');

  const [dtypes] =
    useModelState<Record<string, PandasDTypes>>('df_column_types');
  const columns = useColumnDefs(dfVisibleColumns, ID_COLUMN, data, [], dtypes);

  // Add as required
  const dfColumnsWithInternal = useMemo(() => {
    return [MRT_Row_Selection, ...dfVisibleColumns];
  }, [dfVisibleColumns]);

  const table = useMantineReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      rowSelection,
      columnOrder: dfColumnsWithInternal,
      sorting
    },
    initialState: {
      density: 'xs',
      columnOrder: dfColumnsWithInternal,
      columnPinning: {
        left: [MRT_Row_Selection]
      },
      showGlobalFilter: true
    },
    // Non Trrack
    mantineTableProps: {
      striped: true
    },
    enablePinning: true,
    mantinePaginationProps: {
      fz: PERSIST_MANTINE_FONT_SIZE,
      size: 'xs'
    },
    displayColumnDefOptions: {
      'mrt-row-select': {
        size: 1
      }
    },
    renderToolbarInternalActions: ({ table }) => {
      return (
        <>
          <MRT_ToggleFiltersButton
            table={table}
            fz={PERSIST_MANTINE_FONT_SIZE}
          />
          <MRT_ShowHideColumnsButton table={table} />
          <MRT_ToggleFullScreenButton table={table} />
        </>
      );
    },
    //
    // Filtering table
    filterFns: {
      containsWithNullHandling: (row, id, filterValue) => {
        const val = row.getValue(id) as Nullable<string | number | Date>;

        if (!val) {
          return false;
        }

        return val.toString().includes(filterValue);
      }
    },
    globalFilterFn: 'containsWithNullHandling',
    positionGlobalFilter: 'left',
    mantineSearchTextInputProps: {
      size: 'xs'
    },
    // enableGlobalFilterModes: true,
    // globalFilterModeOptions: [
    //   'fuzzy',
    //   'equals',
    //   'startsWith',
    //   'contains',
    //   'notEmpty',
    //   'notEquals'
    // ],
    //
    // Selections
    // Seelct all is for page
    enableRowSelection: true,
    getRowId: row => row[ID_COLUMN] as string,
    positionToolbarAlertBanner: 'bottom',
    mantineSelectCheckboxProps: {
      size: 'xs',
      width: '100%',
      opacity: 1
    },
    onRowSelectionChange: updater => {
      const selectedRows =
        typeof updater === 'function' ? updater(rowSelection) : updater;

      const selectedIds = Object.entries(selectedRows)
        .filter(([_, sel]) => sel)
        .map(([k, _]) => ({
          store: {
            field: ID_COLUMN,
            channel: 'y',
            type: 'E' as const,
            values: [k]
          },
          value: { [ID_COLUMN]: k }
        }));

      window.Persist.Commands.execute(PersistCommands.pointSelection, {
        cell,
        name: 'index_selection',
        store: selectedIds.map(s => s.store),
        value: selectedIds.map(s => s.value),
        brush_type: 'point'
      });
    },
    // Column reordering
    enableColumnDragging: true,
    enableColumnOrdering: true,
    onColumnOrderChange: updater => {
      const newColumnOrder =
        typeof updater === 'function' ? updater(dfVisibleColumns) : updater;

      const filteredNewColumnOrder = newColumnOrder.filter(
        f => !MRT_DisplayColumns.includes(f)
      );

      let idxMoved = 0;
      while (
        (dfVisibleColumns[idxMoved] === filteredNewColumnOrder[idxMoved] ||
          dfVisibleColumns[idxMoved] ===
            filteredNewColumnOrder[idxMoved + 1]) &&
        idxMoved < dfVisibleColumns.length
      ) {
        idxMoved += 1;
      }

      window.Persist.Commands.execute(PersistCommands.reorderColumns, {
        cell,
        columns: filteredNewColumnOrder,
        overrideLabel: `Moved column '${
          dfVisibleColumns[idxMoved]
        }' moved to position '${filteredNewColumnOrder.indexOf(
          dfVisibleColumns[idxMoved]
        )}'`
      });
    },
    // Column Delete
    renderColumnActionsMenuItems: ({ internalColumnMenuItems, column }) => {
      return (
        <>
          {column.id !== ID_COLUMN && (
            <Menu.Item icon={<IconDatabase />}>
              <DTypeContextMenu column={column} cell={cell} />
            </Menu.Item>
          )}
          {column.id !== ID_COLUMN && (
            <>
              <Menu.Item
                icon={<IconTrash />}
                onClick={() => {
                  if (column.id === ID_COLUMN) {
                    return;
                  }
                  window.Persist.Commands.execute(PersistCommands.dropColumns, {
                    cell,
                    columns: [column.id]
                  });
                }}
              >
                Drop column '{column.id}'
              </Menu.Item>
            </>
          )}
          {![ID_COLUMN].includes(column.id) && (
            <>
              <RenameTableColumnPopover
                open={open}
                onClose={() => setOpen(false)}
                cell={cell}
                column={column}
                allColumnNames={dfVisibleColumns}
              />
            </>
          )}
          {column.id !== ID_COLUMN && <Divider />}
          {internalColumnMenuItems}
        </>
      );
    },
    // Edit Cell
    enableEditing: true,
    editDisplayMode: 'cell',
    mantineEditTextInputProps: props => {
      return {
        onBlur: evt => {
          const columnName = props.cell.column.id;

          const value = applyDTypeToValue(evt.target.value, dtypes[columnName]);
          const row_index = props.cell.row.index;
          const dataPoint = data[row_index];

          if (typeof value === 'number' && isNaN(value)) {
            return;
          }

          if (
            applyDTypeToValue(dataPoint[columnName], dtypes[columnName]) ===
            value
          ) {
            return;
          }

          const idx = dataPoint[ID_COLUMN] as string;

          window.Persist.Commands.execute(PersistCommands.editCell, {
            cell,
            columnName,
            idx,
            value
          });
        }
      };
    },
    // Sorting
    manualSorting: true,
    enableMultiSort: true,
    maxMultiSortColCount: 3,
    onSortingChange: updater => {
      const sortStatus =
        typeof updater === 'function' ? updater(sorting) : updater;

      window.Persist.Commands.execute(PersistCommands.sortByColumn, {
        cell,
        sortStatus
      });
    }
    // end
  });

  return (
    <Box p="1em">
      <MantineReactTable table={table} />
    </Box>
  );
}
