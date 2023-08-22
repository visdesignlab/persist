import {
  AnyMark,
  Mark,
  isMarkDef,
  isPrimitiveMark,
  isRectBasedMark
} from 'vega-lite/build/src/mark';

export function getMark(mark: AnyMark) {
  if (isMarkDef(mark)) {
    return mark.type;
  }

  return mark;
}

export function isPointLike(
  mark: AnyMark
): mark is Exclude<Mark, 'rect' | 'bar' | 'image' | 'arc'> {
  return isPrimitiveMark(mark) && !isRectBasedMark(mark);
}
