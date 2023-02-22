import {
  PartialJSONObject,
  ReadonlyPartialJSONObject
} from '@lumino/coreutils';

export function makeWriteable(
  obj: ReadonlyPartialJSONObject
): PartialJSONObject {
  return obj as PartialJSONObject;
}
