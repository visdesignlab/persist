import { IntervalSelection } from 'vl4/build/src/selection';
import { FilterValue, VL4 } from '../vegaL/types';
import { Interactions } from './types';

export function getFiltersFromRangeSelection(
  spec: VL4.Spec<Interactions.IntervalSelectionAction>,
  selection: IntervalSelection
): Array<FilterValue> {
  const ranges: FilterValue[] = [];

  const { init, encodings = [] } = selection;

  if (!init) return ranges;

  const { params } = spec.usermeta.__ide__;

  if (!params) return ranges;

  // Add if no encodings are specified or if x is specified
  if ('x' in params && (encodings.length === 0 || encodings.includes('x')))
    ranges.push({
      field: params.x.field,
      range: params.x.range
    });

  // Add if no encodings are specified or if y is specified
  if ('y' in params && (encodings.length === 0 || encodings.includes('y')))
    ranges.push({
      field: params.y.field,
      range: params.y.range
    });

  return ranges;
}
