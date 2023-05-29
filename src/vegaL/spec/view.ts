import { TopLevelSpec } from 'vega-lite';
import { Field } from 'vega-lite/build/src/channeldef';
import { Encoding } from 'vega-lite/build/src/encoding';
import { isSelectionPredicate } from 'vega-lite/build/src/predicate';
import { isSelectionParameter } from 'vega-lite/build/src/selection';
import {
  FacetedUnitSpec,
  GenericUnitSpec,
  NormalizedUnitSpec
} from 'vega-lite/build/src/spec';
import { isFilter } from 'vega-lite/build/src/transform';
import { getJSONPath } from '../../utils/jsonpath';
import { MarkedLayerSpec, ProcessableSpec } from './spec';

export function getEncodingForNamedView(spec: TopLevelSpec, name: string) {
  const views = getJSONPath<GenericUnitSpec<Encoding<Field>, any>>(
    spec,
    `$..*[?(@.name==='${name}')]`
  );

  return views[0].value.encoding;
}

export type AnyUnitSpec = FacetedUnitSpec<Field> | NormalizedUnitSpec;

export type Callback<
  T extends ProcessableSpec = MarkedLayerSpec,
  R extends ProcessableSpec = MarkedLayerSpec
> = (spec: T) => R;

export function removeUnitSpecName(spec: AnyUnitSpec) {
  if (spec.name) delete spec.name;

  return spec;
}

export function removeUnitSpecSelectionFilters(spec: AnyUnitSpec) {
  const { transform = [] } = spec;

  spec.transform = transform.filter(
    t => !isFilter(t) || !isSelectionPredicate(t.filter)
  );

  return spec;
}

export function removeUnitSpecSelectionParams(spec: AnyUnitSpec) {
  if (spec.params) {
    spec.params = spec.params.filter(f => !isSelectionParameter(f));
  }

  return spec;
}
