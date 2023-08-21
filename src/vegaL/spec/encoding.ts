import {
  Field,
  Value,
  isConditionalDef,
  isFieldDef
} from 'vega-lite/build/src/channeldef';
import { Encoding, fieldDefs } from 'vega-lite/build/src/encoding';
import { HOVER_CONDITIONAL_TEST_PREDICATE } from '../../interactions/apply';
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

export function convertEncodingToHoverConditional<
  K extends keyof Encoding<Field>
>(
  encoding: Encoding<Field>,
  channel: K,
  elseValue: Value,
  altValue: Nullable<Value> = null,
  overrideTrueValue: Nullable<Value> = null
) {
  const enc = encoding || {};

  if (overrideTrueValue) {
    encoding[channel] = {
      condition: {
        test: HOVER_CONDITIONAL_TEST_PREDICATE('true'),
        value: overrideTrueValue
      },
      value: elseValue
    } as any;
    return enc;
  }

  const channelDef = enc[channel];

  if (!channelDef) {
    encoding[channel] = {
      condition: {
        test: HOVER_CONDITIONAL_TEST_PREDICATE('true'),
        value: altValue
      },
      value: elseValue
    } as any;
    return enc;
  }

  if (isFieldDef(channelDef)) {
    const newDef = {
      condition: {
        test: HOVER_CONDITIONAL_TEST_PREDICATE('true'),
        ...channelDef
      },
      value: elseValue
    } as any;

    encoding[channel] = newDef;
  } else if (isConditionalDef(channelDef as any)) {
    const { param = null, ...rest } = (channelDef as any).condition || {};

    if (param) {
      const _con = {
        param
      };

      (channelDef as any).condition = {
        test: HOVER_CONDITIONAL_TEST_PREDICATE(_con),
        ...rest
      };
      (channelDef as any).value = elseValue;

      encoding[channel] = channelDef;
    }
  }

  return enc;
}
