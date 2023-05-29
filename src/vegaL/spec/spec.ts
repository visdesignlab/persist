import { TopLevelSpec } from 'vega-lite';
import { Field, PrimitiveValue } from 'vega-lite/build/src/channeldef';
import {
  GenericFacetSpec,
  GenericSpec,
  LayerSpec as LS,
  RepeatSpec as RS,
  TopLevel,
  TopLevelFacetSpec
} from 'vega-lite/build/src/spec';
import {
  GenericConcatSpec,
  GenericHConcatSpec,
  GenericVConcatSpec
} from 'vega-lite/build/src/spec/concat';
import { TopLevelParameter } from 'vega-lite/build/src/spec/toplevel';
import {
  FacetedUnitSpec,
  GenericUnitSpec,
  TopLevelUnitSpec
} from 'vega-lite/build/src/spec/unit';

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type Spec = TopLevelSpec;
export type UnitSpec = TopLevelUnitSpec<any>;
export type FacetSpec = TopLevelFacetSpec;

export type LayerSpec = TopLevel<LS<any>>;
export type RepeatSpec = TopLevel<RS>;

export type ConcatSpec = TopLevel<
  GenericConcatSpec<
    GenericSpec<FacetedUnitSpec<any>, LayerSpec, RepeatSpec, Field>
  >
>;
export type HConcatSpec = TopLevel<
  GenericHConcatSpec<
    GenericSpec<FacetedUnitSpec<any>, LayerSpec, RepeatSpec, Field>
  >
>;

export type VConcatSpec = TopLevel<
  GenericVConcatSpec<
    GenericSpec<FacetedUnitSpec<any>, LayerSpec, RepeatSpec, Field>
  >
>;

export type AnyConcatSpec = ConcatSpec & HConcatSpec & VConcatSpec;

export type AnySpec = GenericUnitSpec<any, any> &
  LS<any> &
  GenericFacetSpec<any, any, any>;

export type HasParams = {
  params?: Array<TopLevelParameter>;
};

export function isPrimitiveValue(obj: any): obj is PrimitiveValue {
  const to = typeof obj;
  return to === 'number' || to === 'string' || to === 'boolean';
}
