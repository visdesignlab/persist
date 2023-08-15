import { useHookstate } from '@hookstate/core';
import { useMemo } from 'react';
import { View } from 'vega';
import { TrrackableCell } from '../cells';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { Interactions } from '../interactions/types';
import { TrrackManager } from '../trrack';
import { Nullable } from '../utils';

type DatasetFilterPredicate = NonNullable<
  Parameters<View['getState']>[0]
>['data'];

export type Dataset = {
  values: any[];
  columns: string[];
  label?: string;
};

function originalDatasetPredicate(name: string) {
  return name.startsWith('source_') || name.startsWith('data-');
}

export function getDatasetFromVegaView(
  view: Nullable<View>,
  trrackManager: TrrackManager,
  datasetPredicate: DatasetFilterPredicate = name => !!name
): Dataset {
  if (!view) {
    return {
      values: [],
      columns: []
    };
  }

  const allDatasets =
    view.getState({
      data: datasetPredicate
    }).data || {};

  const datasetNames: string[] = Object.keys(allDatasets);

  const sourceDatasets = datasetNames.filter(originalDatasetPredicate);

  if (sourceDatasets.length !== 1) {
    throw new Error('incorrect dataset names');
  }

  const values: any[] = Object.values(allDatasets[sourceDatasets[0]]);

  let columns = values.length > 0 ? Object.keys(values[0]) : [];

  if (columns.length > 0) {
    const interactions = getInteractionsFromRoot(
      trrackManager,
      trrackManager.current
    );

    const renameColumnInteractions = interactions.filter(
      i => i.type === 'rename-column'
    ) as Array<Interactions.RenameColumnAction>;

    renameColumnInteractions.forEach(({ prevColumnName, newColumnName }) => {
      const idx = columns.findIndex(c => c === prevColumnName);
      if (idx !== -1) {
        columns[idx] = newColumnName;
      }
    });

    const dropColumnInteractions = (
      interactions.filter(
        i => i.type === 'drop-columns'
      ) as Array<Interactions.DropColumnAction>
    )
      .map(i => i.columnNames)
      .flat();

    columns = columns.filter(c => !dropColumnInteractions.includes(c));
  }

  return {
    values,
    columns
  };
}

export function useDatasetFromVegaView(
  cell: TrrackableCell,
  datasetPredicate?: DatasetFilterPredicate
) {
  const vm = useHookstate(cell.vegaManagerState);

  const dataset = useMemo((): Dataset => {
    return getDatasetFromVegaView(
      vm.value?.view,
      cell.trrackManager,
      datasetPredicate
    );
  }, [vm, cell]);

  return dataset;
}
