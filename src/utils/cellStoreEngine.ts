import { StoreEngine } from '@hookstate/localstored';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { TrrackableCell } from '../cells';

export function decompressString(s: string) {
  return decompressFromUTF16(s);
}

export function getCellStoreEngine(cell: TrrackableCell): StoreEngine {
  return {
    getItem(key: string) {
      const val = cell.model.getMetadata(key) as string;

      const processedString = val ? decompressString(val) : val; // decompress if needed

      return processedString;
    },
    setItem(key: string, value: string) {
      cell.model.setMetadata(key, value ? compressToUTF16(value) : value);
    },
    removeItem(key: string) {
      return cell.model.deleteMetadata(key);
    }
  };
}
