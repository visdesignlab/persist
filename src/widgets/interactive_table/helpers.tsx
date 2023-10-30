import { useMemo } from 'react';
import { MRT_ColumnDef } from 'mantine-react-table';
import { PandasDTypes } from './DTypeContextMenu';

export type DataPoint = { index: string } & Record<string, string>;

export type Data = Array<DataPoint>;

export function applyDTypeToValue(value: string, dtype: PandasDTypes) {
  switch (dtype) {
    case 'Int64':
      try {
        return parseInt(value, 10);
      } catch {
        return value;
      }
    case 'Float64':
      try {
        return parseFloat(value);
      } catch {
        return value;
      }
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'datetime64[ns]':
      return new Date(value).getTime();
    default:
      return value;
  }
}

function getDType(columnKey: string, dTypeMap: Record<string, PandasDTypes>) {
  return dTypeMap[columnKey] ?? 'string';
}

export function useColumnDefs(
  columns: string[],
  idColumn: string,
  data: Data,
  columnsToExclude: string[] = [],
  dTypeMap: Record<string, PandasDTypes> = {}
) {
  return useMemo<MRT_ColumnDef<DataPoint>[]>(() => {
    return columns
      .filter(c => !columnsToExclude.includes(c))
      .map(columnKey => ({
        id: columnKey,
        accessorFn: r => {
          return r[columnKey];
        },
        meta: {
          dType: dTypeMap[columnKey],
          values: data.map(d => d[columnKey])
        },
        header: columnKey === idColumn ? 'ID_' : columnKey,
        size: columnKey === idColumn ? 100 : undefined,
        enableEditing: columnKey !== idColumn,
        Cell: ({ renderedCellValue }) => {
          const dtype = dTypeMap[columnKey];

          if (dtype === 'boolean') {
            if (renderedCellValue && renderedCellValue === true) {
              return 'True';
            }
            return 'False';
          }

          if (
            dtype === 'datetime64[ns]' &&
            typeof renderedCellValue === 'number'
          ) {
            return new Date(renderedCellValue)
              .toLocaleDateString()
              .replace(/\//g, '-');
          }

          return renderedCellValue;
        },
        mantineEditTextInputProps: {
          type: getInputType(getDType(columnKey, dTypeMap))
        }
      }));
  }, [columns, columnsToExclude]);
}

export function getFilterTypeFromDType(type: PandasDTypes) {
  switch (type) {
    case 'Int64':
    case 'Float64':
      return 'range-slider';
    case 'boolean':
      return 'checkbox';
    case 'datetime64[ns]':
      return 'date-range';
    default:
      return 'text';
  }
}

export function getInputType(type: PandasDTypes) {
  switch (type) {
    case 'Int64':
    case 'Float64':
      return 'number';
    case 'boolean':
      return 'checkbox';
    case 'datetime64[ns]':
      return 'date';
    default:
      return 'text';
  }
}
