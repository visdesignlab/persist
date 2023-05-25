import { TopLevelSpec } from 'vega-lite';
import { Field } from 'vega-lite/build/src/channeldef';
import { Encoding } from 'vega-lite/build/src/encoding';
import { GenericUnitSpec } from 'vega-lite/build/src/spec';
import { getJSONPath } from '../../utils/jsonpath';

export function getEncodingForNamedView(spec: TopLevelSpec, name: string) {
  const views = getJSONPath<GenericUnitSpec<Encoding<Field>, any>>(
    spec,
    `$..*[?(@.name==='${name}')]`
  );

  return views[0].value.encoding;
}
