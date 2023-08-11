export type StringFilterPredicate = (str: string) => boolean;
const DEFAULT_REMOVE_FALSY_PREDICATE: StringFilterPredicate = (str: string) =>
  Boolean(str);

export function stringConcater(sep: string, ...args: string[]): string {
  return args.join(sep);
}

export function stringConcatCreator(
  sep: string,
  filterPredicate = DEFAULT_REMOVE_FALSY_PREDICATE
) {
  return function (...args: string[]): string {
    return stringConcater(sep, ...args.filter(filterPredicate));
  };
}

export const stringConcatWithUnderscore = stringConcatCreator('_');
