export function prettify(obj: any) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Helper type to make reading derived union and intersection types easier.
 * Purely asthetic
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
  /* eslint-disable */
} & {};
