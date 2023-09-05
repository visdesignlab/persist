import { StoreEngine } from '@hookstate/localstored';
import { TrrackableCell } from '../cells';

export function getCellStoreEngine(cell: TrrackableCell): StoreEngine {
  return {
    getItem(key: string) {
      const val = cell.model.getMetadata(key);
      return val ? JSON.parse(val) : val;
    },
    setItem(key: string, value: unknown) {
      const savedValue = cell.model.setMetadata(
        key,
        value ? JSON.stringify(value) : value
      );

      return savedValue;
    },
    removeItem(key: string) {
      return cell.model.deleteMetadata(key);
    }
  };
}
