import { View } from 'vega';

type DatasetFilterPredicate = NonNullable<
  Parameters<View['getState']>[0]
>['data'];

export type Dataset = any[];

export function getDatasetFromVegaView(
  view: View,
  datasetPredicate: DatasetFilterPredicate = name =>
    !!name && (name.startsWith('source_') || name.startsWith('data-'))
): Dataset {
  const state = view.getState({
    data: datasetPredicate
  });

  const datasetNames: string[] = state.data ? Object.keys(state.data) : [];

  if (datasetNames.length !== 1) {
    throw new Error('incorrect dataset names');
  }

  const data: any[] = Object.values(state.data[datasetNames[0]]);

  return data;
}
