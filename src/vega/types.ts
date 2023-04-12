import { FixedTuple } from '../types/tsHelpers';

export type Range<N extends number> = FixedTuple<N, number>;

type TupleField = {
  field: string;
  channel: string;
  type: string;
  getter: any;
};

type NamedSelectionIntervalSignals<Dims extends number> = {
  [key: `${string}_x`]: Range<Dims>;
  [key: `${string}_y`]: Range<Dims>;
  [key: `${string}_tuple`]: {
    unit: string;
    fields: Array<TupleField>;
    values: Array<Range<Dims>>;
  };
} & {
  [key: string]: {
    [key: string]: [number, number];
  };
};

export type SelectionIntervalSignal<Dims extends number = 2> =
  NamedSelectionIntervalSignals<Dims>;
