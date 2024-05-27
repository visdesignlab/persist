import { ImmutableObject } from '@hookstate/core';
import { cloneDeep } from 'lodash';

export type NoImmutable<T> = T extends ImmutableObject<infer R>
  ? R
  : T extends null
    ? null
    : never;

export function stripImmutableClone<T>(ob: T): NoImmutable<T> {
  return cloneDeep(ob) as any;
}

export function stripImmutableCloneJSON<T>(ob: T): NoImmutable<T> {
  return JSON.parse(JSON.stringify(ob));
}
