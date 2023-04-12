import { Nullable } from '../types';

export function debounce<Args extends readonly unknown[]>(
  func: (...args: Args) => void,
  wait: Nullable<number> = null
) {
  let timeout: number | undefined;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait || 700);
  };
}
