import { AnyMark, isMarkDef } from 'vega-lite/build/src/mark';

export function getMark(mark: AnyMark) {
  if (isMarkDef(mark)) {
    return mark.type;
  }

  return mark;
}
