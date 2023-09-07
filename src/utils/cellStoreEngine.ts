import { StoreEngine } from '@hookstate/localstored';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { TrrackableCell } from '../cells';

type SaveObject = {
  str: string;
  compressed: boolean;
};

export function getCellStoreEngine(
  cell: TrrackableCell,
  compress = true
): StoreEngine {
  const stringify = (v: SaveObject) => JSON.stringify(v);
  const parse = (v: string) => JSON.parse(v) as SaveObject;

  return {
    getItem(key: string) {
      const val =
        (cell.model.getMetadata(key) as string) ||
        stringify({
          compressed: false,
          str: stringify(null as any)
        }); //  read current value from metadata

      console.log('Getting', { val });
      const saveObject = parse(val);

      console.log('Getting', { saveObject });

      const { str, compressed } = saveObject; // destructure into parts

      const processedString = compressed ? decompressFromUTF16(str) : str; // decompress if needed

      return processedString;
    },
    setItem(key: string, value: string) {
      const saveObject: SaveObject = {
        str: compress ? compressToUTF16(value) : value,
        compressed: compress
      };

      console.log('Saving', { saveObject });

      cell.model.setMetadata(key, stringify(saveObject));
    },
    removeItem(key: string) {
      return cell.model.deleteMetadata(key);
    }
  };
}
