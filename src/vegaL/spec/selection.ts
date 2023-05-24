import {
  SelectionParameter,
  TopLevelSelectionParameter,
  isSelectionParameter
} from 'vega-lite/build/src/selection';
import { TopLevelParameter } from 'vega-lite/build/src/spec/toplevel';

export function isTopLevelSelectionParameter(
  selection: TopLevelParameter
): selection is TopLevelSelectionParameter & {
  views?: string[];
} {
  return isSelectionParameter(selection) && 'views' in selection;
}

export function isSelectionInterval(
  selection: TopLevelSelectionParameter
): selection is SelectionParameter<'interval'> {
  const { select } = selection;

  return typeof select === 'string'
    ? select === 'interval'
    : select.type === 'interval';
}

export function isSelectionPoint(
  selection: TopLevelSelectionParameter
): selection is SelectionParameter<'point'> {
  const { select } = selection;

  return typeof select === 'string'
    ? select === 'point'
    : select.type === 'point';
}
