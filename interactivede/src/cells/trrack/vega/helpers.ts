import { SelectionInterval } from '../../../types';

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

export function getRangeFromSelectionInterval(
  init: SelectionInterval['params']['selection']
): Array<{
  field: string;
  range: number[];
}> {
  const ranges: {
    field: string;
    range: number[];
  }[] = [];

  Object.entries(init).forEach(([dimension, range]) => {
    ranges.push({
      field: dimension,
      range
    });
  });

  return ranges;
}
