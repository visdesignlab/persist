export function applyReducedMap<T, R>(
  arr: Array<T>,
  process: (arg: T) => R,
  predicate: (arg: T) => boolean = (arg: T) => !!arg
): Array<R> {
  return arr.reduce<Array<R>>((acc, ob) => {
    if (predicate(ob)) {
      acc.push(process(ob));
    }

    return acc;
  }, [] as R[]);
}
