export function pipe<T>(...fns: Array<(arg: T) => T>) {
  return fns.reduce((f, g) => (arg: T) => g(f(arg)));
}
