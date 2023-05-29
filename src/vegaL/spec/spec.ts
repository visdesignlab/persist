import { TopLevelSpec } from 'vega-lite';
import { Field, PrimitiveValue } from 'vega-lite/build/src/channeldef';
import {
  GenericFacetSpec,
  GenericSpec,
  LayerSpec as LS,
  RepeatSpec as RS,
  TopLevel,
  TopLevelFacetSpec,
  isFacetSpec,
  isLayerSpec,
  isRepeatSpec
} from 'vega-lite/build/src/spec';
import {
  GenericConcatSpec,
  GenericHConcatSpec,
  GenericVConcatSpec,
  isConcatSpec,
  isHConcatSpec,
  isVConcatSpec
} from 'vega-lite/build/src/spec/concat';
import { TopLevelParameter } from 'vega-lite/build/src/spec/toplevel';
import {
  FacetedUnitSpec,
  GenericUnitSpec,
  TopLevelUnitSpec,
  isUnitSpec
} from 'vega-lite/build/src/spec/unit';
import { deepClone } from '../../utils/deepClone';
import { AnyUnitSpec, Callback } from './view';

export const IDE_MARKER = '__IDE_MARKER__';

export type ProcessableSpec = AnyUnitSpec | MarkedLayerSpec;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type MarkedLayerSpec = LS<Field> & {
  [IDE_MARKER]: string;
};

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

export function isMarkedLayerSpec(spec: any): spec is MarkedLayerSpec {
  return IDE_MARKER in spec;
}

export function prepareSpecsForIDE(spec: AnyUnitSpec): MarkedLayerSpec {
  // TODO: Sanitize the spec?

  return {
    [IDE_MARKER]: IDE_MARKER,
    layer: [spec]
  };
}

export function stripIDEFromMarkedSpecs(spec: MarkedLayerSpec): LayerSpec {
  const { [IDE_MARKER]: _, ...oSpec } = spec;

  return oSpec;
}

export function processMarkedLayerSpec(
  spec: MarkedLayerSpec,
  callback: Callback<MarkedLayerSpec, MarkedLayerSpec>
) {
  return callback(spec);
}

export function processUnitSpec<R extends ProcessableSpec>(
  spec: AnyUnitSpec,
  callback: Callback<AnyUnitSpec, R>
) {
  return callback(spec);
}

export function processSpec<
  T extends ProcessableSpec,
  R extends ProcessableSpec
>(_spec: any, callback: Callback<T, R>): any {
  let spec = deepClone(_spec);

  if (isUnitSpec(spec)) {
    spec = processUnitSpec(spec, callback as any);
  } else if (isMarkedLayerSpec(spec)) {
    spec = processMarkedLayerSpec(spec, callback as any);
  } else if (isLayerSpec(spec)) {
    for (let i = 0; i < spec.layer.length; ++i) {
      spec.layer[i] = processSpec(spec.layer[i], callback);
    }
  } else if (isRepeatSpec(spec)) {
    spec.spec = processSpec(spec.spec, callback);
  } else if (isFacetSpec(spec)) {
    spec.spec = processSpec(spec.spec, callback);
  } else if (isVConcatSpec(spec)) {
    for (let i = 0; i < spec.vconcat.length; ++i) {
      spec.vconcat[i] = processSpec(spec.vconcat[i], callback);
    }
  } else if (isHConcatSpec(spec)) {
    for (let i = 0; i < spec.hconcat.length; ++i) {
      spec.hconcat[i] = processSpec(spec.hconcat[i], callback);
    }
  } else if (isConcatSpec(spec)) {
    for (let i = 0; i < spec.concat.length; ++i) {
      spec.concat[i] = processSpec(spec.concat[i], callback);
    }
  }

  return spec;
}
