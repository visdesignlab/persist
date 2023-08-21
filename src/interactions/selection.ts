import { SelectionParameter } from 'vega-lite/build/src/selection';

export type PointSelectionValue = Extract<
  NonNullable<SelectionParameter<'point'>['value']>,
  Array<unknown>
>;

export type IntervalSelectionValue = NonNullable<
  SelectionParameter<'interval'>['value']
>;

export function getPointSelectionInteractionLabel(
  _selector: SelectionParameter<'point'>,
  _value: PointSelectionValue
) {
  return 'Point selection';
}

export function getIntervalSelectionInteractionLabel(
  _selector: SelectionParameter<'interval'>,
  _value: IntervalSelectionValue
) {
  return 'Brush selection';
}
