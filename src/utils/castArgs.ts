import { ReadonlyPartialJSONObject } from '@lumino/coreutils';

export function castArgs<T>(args: ReadonlyPartialJSONObject): T {
  return args as unknown as T;
}
