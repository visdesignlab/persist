import { ImmutableObject } from '@hookstate/core';
import { parseStringify } from './jsonHelpers';

export type NoImmutable<T> = T extends ImmutableObject<infer R>
  ? R
  : T extends null
  ? null
  : never;

export function stripImmutableClone<T>(ob: T): NoImmutable<T> {
  return parseStringify(ob) as any;
}

export function stripImmutableCloneJSON<T>(ob: T): NoImmutable<T> {
  return JSON.parse(JSON.stringify(ob));
}
