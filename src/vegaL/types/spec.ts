import { TopLevelSpec } from 'vl4';
import { Interactions } from '../../interactions/types';

export namespace VL4 {
  export type Spec<
    T extends Interactions.InteractionParams = Interactions.InteractionParams
  > = Omit<TopLevelSpec, 'usermeta'> & {
    usermeta: {
      __ide__: T;
    };
  };
  export type UnitSpec = Extract<Spec, { mark: unknown }>;
  export type FacetSpec = Extract<Spec, { facet: unknown }>;

  export type LayerSpec = Extract<Spec, { layer: unknown }>;
  export type RepeatSpec = Extract<Spec, { repeat: unknown }>;

  export type ConcatSpec = Extract<Spec, { concat: unknown }>;
  export type HConcatSpec = Extract<Spec, { hconcat: unknown }>;
  export type VConcatSpec = Extract<Spec, { vconcat: unknown }>;
  export type AnyConcatSpec = ConcatSpec | HConcatSpec | VConcatSpec;
}
