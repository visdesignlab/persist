import { Field, isFieldDef } from 'vega-lite/build/src/channeldef';
import { Encoding, fieldDefs } from 'vega-lite/build/src/encoding';
import { Nullable } from '../../utils';
import { deepClone } from '../../utils/deepClone';
import { objectKeys } from '../../utils/objectKeys';

type ApplyEncodingCallback<
  K extends keyof Encoding<Field> = keyof Encoding<Field>
> = (key: K, encoding: Encoding<Field>[K]) => Encoding<Field>[K] | null;

export type EncodingList = ReturnType<typeof getEncodingList>;

export function getEncodingList(encoding: Nullable<Encoding<Field>>) {
  const enc = encoding || {};

  return objectKeys(enc).map(key => ({
    key,
    value: deepClone(enc[key])
  }));
}

export function forEachEncoding(
  encoding: Encoding<Field>,
  cb: ApplyEncodingCallback
) {
  const encodedChannels = objectKeys(encoding);

  encodedChannels.forEach(channel => {
    cb(channel, encoding[channel]);
  });
}

export function applyToEncodings(
  encoding: Encoding<Field>,
  cb: ApplyEncodingCallback
): Encoding<Field> {
  const encodedChannels = objectKeys(encoding);

  encodedChannels.forEach(channel => {
    const channelDef = encoding[channel];

    encoding = addEncoding(encoding, channel, cb(channel, channelDef));
  });

  return encoding;
}

export function convertEncodingListToEncoding(
  list: EncodingList
): Encoding<Field> {
  const enc = list.reduce((e: any, { key, value }) => {
    e[key] = value;
  }, {});

  return enc;
}

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

export function getFieldsFromEncoding(encoding: Encoding<Field>) {
  const val = fieldDefs(encoding);

  return val;
}

export function addEncoding<K extends keyof Encoding<Field>>(
  encoding: Nullable<Encoding<Field>>,
  name: K,
  value: Encoding<Field>[K]
) {
  encoding = encoding || {};

  return {
    ...encoding,
    [name]: value
  };
}

export function removeEncoding<K extends keyof Encoding<Field>>(
  encoding: Nullable<Encoding<Field>>,
  name: K
) {
  encoding = encoding || {};

  delete encoding[name];

  return encoding;
}
