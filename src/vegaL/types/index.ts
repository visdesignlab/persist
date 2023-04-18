import { Field, Interactions } from '../../interactions/types';
import { Range } from '../../utils';

const SCHEMA = '$schema';

// Helper types

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

// Signals
type Base<Dims extends number> = {
  [key: string]: Range<Dims>;
};

type NamedSelectionIntervalSignals<Dims extends number> = {
  [key: string]: Range<Dims> | Base<Dims> | Array<Tuple<Dims>>;
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

// Selections
type CommonSelectionProperties = {
  empty?: 'none' | 'all';
};

export type SelectionType = 'interval' | 'single' | 'multi';

export type SelectionIntervalInit = {
  x: Range<2>;
  y: Range<2>;
  __ide__: Interactions.SelectionInterval;
};

export type VegaSelection = CommonSelectionProperties &
  (
    | {
        type: 'interval';
        init?: SelectionIntervalInit;
      }
    | {
        type: 'single';
      }
  );

type RangeFilter = {
  fiield: string;
  range: Range<2>;
};

type AndFilter = {
  and: Array<VegaFilter>;
};

type NotFilter = {
  not: VegaFilter;
};

type OrFilter = {
  or: Array<VegaFilter>;
};

export type VegaFilter =
  | Record<string, any>
  | RangeFilter
  | AndFilter
  | NotFilter
  | OrFilter;

export type SingleVegaTransform = {
  filter?: VegaFilter;
};

export type VegaTransform = Array<SingleVegaTransform>;

export type Vegalite4Spec = {
  [key: string]: unknown;
  $schema: string;
  selection: {
    [key: string]: VegaSelection;
  };
  transform?: VegaTransform;
};

export type UrlData = {
  data: {
    url: string;
  };
};

export function isValidVegalite4Spec(spec: any): spec is Vegalite4Spec {
  return (
    Object.keys(spec).includes(SCHEMA) &&
    spec[SCHEMA].includes('https://vega.github.io/schema/vega-lite/v4.')
  );
}
