import { NoImmutable } from './stripImmutableClone';

export function removeImmutable<T>(ob: T): NoImmutable<T> {
  return ob as any;
}
