import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import {
  ITrrackManager,
  TrrackableCell,
  TrrackableCellId,
  VegaManager
} from '../cells';
import { Executor } from '../notebook';
import { Nullable } from '../types';
import { Logging } from './logging';

// eslint-disable-next-line @typescript-eslint/naming-convention
export class IDEGlobal {
  static LOGGER: Logging;
  static trracks: Map<TrrackableCellId, ITrrackManager>;
  static views: Map<TrrackableCellId, VegaManager>;
  static cells: Map<TrrackableCellId, TrrackableCell>;
  static renderMimeRegistry: IRenderMimeRegistry;
  static executor?: Nullable<Executor>;
}

(window as any).IDEGlobal = IDEGlobal;
