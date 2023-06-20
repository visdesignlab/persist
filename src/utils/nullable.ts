export type Nullable<T> = T | null | undefined;

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null || value !== undefined;
}
