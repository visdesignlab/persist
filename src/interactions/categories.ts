export type Option = {
  name: string;
};

export type Options = Record<string, Option>;

export type Category = {
  name: string;
  options: Options;
};

export type CategoryRecord = Record<string, Category>;

export function toArray<T extends Record<string, any>>(
  record: T
): Array<T[string]> {
  return Object.values(record);
}
