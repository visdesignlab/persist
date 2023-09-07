import { ImmutableObject } from '@hookstate/core';

export type NoImmutable<T> = T extends ImmutableObject<infer R>
  ? R
  : T extends null
  ? null
  : never;

export function stripImmutableClone<T>(ob: T): NoImmutable<T> {
  return structuredClone(ob) as any;
}
