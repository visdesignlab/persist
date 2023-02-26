import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import {
  ITrrackManager,
  TrrackableCell,
  TrrackableCellId,
  VegaManager
} from '../cells';
import { NotebookManager } from '../notebook';
import { Logging } from './logging';

// eslint-disable-next-line @typescript-eslint/naming-convention
export class IDEGlobal {
  static LOGGER: Logging;
  static trracks: Map<TrrackableCellId, ITrrackManager>;
  static views: Map<TrrackableCellId, VegaManager>;
  static cells: Map<TrrackableCellId, TrrackableCell>;
  static renderMimeRegistry: IRenderMimeRegistry;
  static nbManager: NotebookManager;
}
