type BaseSelectionIntervalSignals = {
  width: number;
} & {
  height: number;
};

type KV<K extends string, V> = {
  [key in K]: V;
};

type NamedSelectionIntervalSignals = KV<
  string,
  {
    [key: string]: [number, number];
  }
> &
  KV<`${string}_x`, [number, number]> &
  KV<`${string}_y`, [number, number]> &
  any;

export type SelectionIntervalSignal = BaseSelectionIntervalSignals &
  NamedSelectionIntervalSignals;
