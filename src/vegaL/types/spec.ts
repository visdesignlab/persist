import { TopLevelSpec } from 'vl4';
import { Field } from 'vl4/build/src/channeldef';
import {
  GenericSpec,
  LayerSpec as LS,
  RepeatSpec as RS,
  TopLevel,
  TopLevelFacetSpec
} from 'vl4/build/src/spec';
import {
  GenericConcatSpec,
  GenericHConcatSpec,
  GenericVConcatSpec
} from 'vl4/build/src/spec/concat';
import { FacetedUnitSpec, TopLevelUnitSpec } from 'vl4/build/src/spec/unit';
import { Interactions } from '../../interactions/types';
import { deepClone } from '../../utils/deepClone';

export namespace VL4 {
  export type Spec<
    T extends Interactions.InteractionParams = Interactions.InteractionParams
  > = Omit<TopLevelSpec, 'usermeta'> & {
    usermeta: {
      __ide__: T;
    };
  };
  export type UnitSpec = TopLevelUnitSpec;
  export type FacetSpec = TopLevelFacetSpec;

  export type LayerSpec = TopLevel<LS>;
  export type RepeatSpec = TopLevel<RS>;

  export type ConcatSpec = TopLevel<
    GenericConcatSpec<
      GenericSpec<FacetedUnitSpec, LayerSpec, RepeatSpec, Field>
    >
  >;
  export type HConcatSpec = TopLevel<
    GenericHConcatSpec<
      GenericSpec<FacetedUnitSpec, LayerSpec, RepeatSpec, Field>
    >
  >;

  export type VConcatSpec = TopLevel<
    GenericVConcatSpec<
      GenericSpec<FacetedUnitSpec, LayerSpec, RepeatSpec, Field>
    >
  >;

  export type AnyConcatSpec = ConcatSpec | HConcatSpec | VConcatSpec;

  const COMMON_KEYS: Array<keyof TopLevelSpec> = [
    'usermeta',
    'title',
    'name',
    'description',
    'data',
    'transform',
    'resolve',
    'background',
    'padding',
    'autosize',
    'params',
    '$schema',
    'config',
    'datasets'
  ];

  export function getMinimalTopLevelSpec(spec: Spec) {
    const _spec = deepClone(spec) as any;

    Object.keys(_spec).forEach((key: any) => {
      if (!COMMON_KEYS.includes(key)) {
        delete _spec[key];
      }
    });

    return _spec;
  }

  export function getMinimalUnitSpec(spec: Spec) {
    const _spec = deepClone(spec) as any;

    Object.keys(_spec).forEach((key: any) => {
      if (COMMON_KEYS.includes(key)) {
        delete _spec[key];
      }
    });

    return _spec;
  }
}
