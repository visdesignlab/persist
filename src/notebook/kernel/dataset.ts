import { NodeId } from '@trrack/core';
import { TrrackableCell } from '../../cells';
import { computeDataFrame } from './utils';

import { JSONPath as jp } from 'jsonpath-plus';
import { DF_NAME } from '../../trrack';
import { IDEGlobal, Nullable } from '../../utils';

export type GlobalDatasetCounter = {
  selection: number;
  filter: number;
  root: number;
};

export type DatasetStatus = {
  id: NodeId;
};

export async function extractDatasetForTrrackNode(cell: TrrackableCell) {
  const view = IDEGlobal.vegaManager.get(cell.cellId);
  if (!view) return;

  const trrack = cell.trrackManager.trrack;

  let dfName = trrack.metadata.latestOfType(DF_NAME)?.val as Nullable<string>;

  if (!dfName) dfName = 'SOMETHING_WENT_REALLY_WRONG';

  const dataPaths = jp({
    path: '$..data..name',
    json: view.vega?.vgSpec || {},
    resultType: 'all'
  }) as any[];

  const dataSource = dataPaths.find(d => d.value.includes('source'));

  const data = view.vega?.view.data(dataSource.value);

  if (!data) return Promise.resolve();

  const dfString = JSON.stringify(data || []);

  return computeDataFrame(dfName, dfString).then(c => {
    console.log({ c });
  });
}
