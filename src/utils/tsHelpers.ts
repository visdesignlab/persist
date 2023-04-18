export type FixedTuple<
  L extends number = 0,
  T = unknown,
  Acc extends unknown[] = []
> = Acc extends {
  length: L;
}
  ? Acc
  : FixedTuple<L, T, [...Acc, T]>;

export type Range<N extends number> = FixedTuple<N, number>;
