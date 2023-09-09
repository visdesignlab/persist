export function stringify<T>(val: T): string {
  return JSON.stringify(val);
}

export function parse<T>(str: string): T {
  return JSON.parse(str);
}

export function parseStringify<T>(obj: T): T {
  if (!obj) return obj;
  return parse(stringify(obj));
}
