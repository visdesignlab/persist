import { Nullable, Range } from '../../utils';

type TupleValue<Dims extends number> = Array<Range<Dims>>;

export type BaseTupleField = {
  type: unknown;
  field: string;
};

export type RangeSelectionTupleField = BaseTupleField & {
  channel: 'x' | 'y'; // ? can it be anything else
  type: 'R';
};

export type SingleSelectionTupleField = BaseTupleField & {
  field: '_vgsid_';
  type: 'E';
  values: Array<number>;
};

export type TupleField = RangeSelectionTupleField | SingleSelectionTupleField;

export type Tuple<Dims extends number, Type extends BaseTupleField> = {
  unit: string;
  fields: Array<Type>;
  values: TupleValue<Dims>;
};

type Base<Dims extends number> = {
  [key: string]: Range<Dims>;
};

export type NamedSelectionIntervalSignals<
  Dims extends number,
  Type extends BaseTupleField
> = {
  [key: string]: Nullable<Range<Dims> | Base<Dims> | Array<Tuple<Dims, Type>>>;
};

export type SelectionIntervalSignal<Dims extends number = 2> =
  NamedSelectionIntervalSignals<Dims, RangeSelectionTupleField>;
