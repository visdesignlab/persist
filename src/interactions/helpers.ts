import { VegaFilter } from '../vegaL/types';
import { Interactions } from './types';

export function getFiltersFromRangeSelection(
  params: Interactions.SelectionParams<Interactions.SelectionInterval>
): Array<VegaFilter> {
  const ranges: VegaFilter[] = [];

  ranges.push({
    field: params.x.field,
    range: params.x.domain
  });
  ranges.push({
    field: params.y.field,
    range: params.y.domain
  });

  return ranges;
}
