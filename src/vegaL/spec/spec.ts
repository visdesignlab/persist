import { TopLevelSpec } from 'vega-lite';
import { Field } from 'vega-lite/build/src/channeldef';
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
  TopLevelUnitSpec,
  isUnitSpec
} from 'vega-lite/build/src/spec/unit';

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

export function isTopLevelSpec(spec: any): spec is TopLevelSpec {
  return '$schema' in spec;
}

export function isTopLevelUnitSpec<F extends Field>(
  spec: any
): spec is TopLevelUnitSpec<F> {
  return isTopLevelSpec(spec) && isUnitSpec(spec);
}

export type HasParams = {
  params?: Array<TopLevelParameter>;
};

export function hasSelectionParams(spec: any): spec is HasParams {
  return 'params' in spec;
}
