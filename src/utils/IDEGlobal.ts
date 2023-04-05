import { NodeId } from '@trrack/core';
import { TrrackableCell, TrrackableCellId, VegaManager } from '../cells';
import { Executor } from '../notebook';
import { DatasetStatus, GlobalDatasetCounter } from '../notebook/kernel';
import { IDELogger } from './logging';

type DatasetRecord = {
  counter: GlobalDatasetCounter;
  datasetStatusMap: Map<NodeId, DatasetStatus>;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export class IDEGlobal {
  static cells: Map<TrrackableCellId, TrrackableCell> = new Map();
  static vegaManager: Map<TrrackableCellId, VegaManager> = new Map();
  static executor = new Executor();
  static Logger: IDELogger;
  static currentNotebook: string;
  static Datasets: DatasetRecord = {
    counter: {
      selection: -1,
      filter: -1,
      root: -1
    },
    datasetStatusMap: new Map()
  };
}

(window as any).IDEGlobal = IDEGlobal;
