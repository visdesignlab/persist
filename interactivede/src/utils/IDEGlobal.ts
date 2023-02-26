import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ITrrackManager } from '../cells/trrack/trrackManager';
import { VegaManager } from '../cells/trrack/vega/vegaManager';
import { TrrackableCell, TrrackableCellId } from '../cells/trrackableCell';
import { NotebookManager } from '../notebook/manager';
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
