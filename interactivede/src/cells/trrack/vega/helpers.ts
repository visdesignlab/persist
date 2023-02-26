import { SelectionInterval } from '../../../types/interaction';

export function getQueryStringFromSelectionInterval({
  params: { selection }
}: SelectionInterval): string {
  const subQueries: string[] = [];
  Object.entries(selection).forEach(([dimension, range]) => {
    subQueries.push(
      `${Math.round(range[0] * 1000) / 1000} <= ${dimension} <= ${
        Math.round(range[1] * 1000) / 1000
      }`
    );
  });

  return subQueries.filter(q => q.length > 0).length > 0
    ? subQueries.join(' & ')
    : '';
}
