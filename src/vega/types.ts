import { FixedTuple } from '../types/tsHelpers';

export type Range<N extends number> = FixedTuple<N, number>;

type TupleField = {
  field: string;
  channel: 'x' | 'y'; // ? can it be anything else
  type: string;
  getter: any;
};

type TupleValue<Dims extends number> = Array<Range<Dims>>;

type Tuple<Dims extends number> = {
  unit: string;
  fields: Array<TupleField>;
  values: TupleValue<Dims>;
};

type Base<Dims extends number> = {
  [key: string]: Range<Dims>;
};

type NamedSelectionIntervalSignals<Dims extends number> = {
  [key: string]: Range<Dims> | Base<Dims> | Array<Tuple<Dims>>;
};

export type Field<Dims extends number> = {
  field: string;
  domain: Range<Dims>;
  pixel: Range<Dims>;
};

export type SelectionIntervalSignal<Dims extends number = 2> =
  NamedSelectionIntervalSignals<Dims>;

function getBaseSignal<Dims extends number>(
  signals: SelectionIntervalSignal<Dims>,
  base: string
) {
  return signals[base] as {
    [key: string]: Range<Dims>;
  };
}

function getSignalTuple<Dims extends number>(
  signals: SelectionIntervalSignal<Dims>,
  base: string
) {
  return signals[`${base}_tuple`] as Tuple<Dims>;
}

function getSignalX<Dims extends number>(
  signals: SelectionIntervalSignal<Dims>,
  base: string
) {
  return signals[`${base}_x`] as Range<Dims>;
}

function getSignalY<Dims extends number>(
  signals: SelectionIntervalSignal<Dims>,
  base: string
) {
  return signals[`${base}_y`] as Range<Dims>;
}

export function wrapSignal<Dims extends number>(
  signals: SelectionIntervalSignal<Dims>,
  base: string
) {
  const tuple = getSignalTuple(signals, base);

  const x = tuple.fields.filter(a => a.channel === 'x')[0].field;
  const y = tuple.fields.filter(a => a.channel === 'y')[0].field;

  return {
    get x(): Field<Dims> {
      return {
        field: x,
        pixel: getSignalX(signals, base),
        domain: getBaseSignal(signals, base)[x]
      };
    },
    get y(): Field<Dims> {
      return {
        field: y,
        pixel: getSignalY(signals, base),
        domain: getBaseSignal(signals, base)[y]
      };
    }
  };
}
