export function objectToKeyValuePairs<T>(ob: Record<string, T>) {
  if (typeof ob !== 'object') return [];

  return Object.entries(ob).map(([k, v]: [string, T]) => ({
    key: k,
    value: v
  }));
}
