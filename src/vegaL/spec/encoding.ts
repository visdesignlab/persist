import { Field, isFieldDef } from 'vega-lite/build/src/channeldef';
import { Encoding } from 'vega-lite/build/src/encoding';

export function getFieldNamesFromEncoding(
  encoding: Encoding<Field>,
  keys: Array<keyof Encoding<Field>>
) {
  const map = keys
    .map(k => {
      const f = encoding[k];
      if (isFieldDef(f) && f.field) {
        return {
          [k]: f.field
        } as { [K in keyof Encoding<Field>]: Encoding<Field>[K] };
      }
    })
    .filter(k => !!k)
    .reduce((acc, o) => {
      return { ...acc, ...o };
    }, {});

  return map;
}
