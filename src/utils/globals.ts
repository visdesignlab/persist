import { TrrackableCell, TrrackableCellId } from '../cells';

declare global {
  // eslint-disable-next-line
  interface Window {
    CellMap: Map<TrrackableCellId, TrrackableCell>;
  }
}
