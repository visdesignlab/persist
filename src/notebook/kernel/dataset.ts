import { NodeId } from '@trrack/core';
import { TrrackableCell } from '../../cells';
import { computeDataFrame } from './utils';

import { Nullable } from '../../utils';

export const DF_NAME = 'DF_NAME';

export type GlobalDatasetCounter = {
  selection: number;
  filter: number;
  root: number;
};

export type DatasetStatus = {
  id: NodeId;
};

export async function extractDatasetForTrrackNode(cell: TrrackableCell) {
  const view = cell.vegaManager;
  if (!view) {
    return;
  }

  const trrack = cell.trrackManager.trrack;

  let dfName = trrack.metadata.latestOfType(DF_NAME)?.val as Nullable<string>;

  if (!dfName) {
    dfName = 'SOMETHING_WENT_REALLY_WRONG';
  }

  const dataPaths = [] as any[];

  const dataSource = dataPaths.find(d => d.value.includes('source'));

  const data = view.vega?.view.data(dataSource.value);

  if (!data) {
    return Promise.resolve();
  }

  const dfString = JSON.stringify(data || []);

  return computeDataFrame(dfName, dfString).then(_ => {
    // no-op
  });
}
