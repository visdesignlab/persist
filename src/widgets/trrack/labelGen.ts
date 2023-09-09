export type LabelLike = string | (() => string);

export function getLabelFromLabelLike(label: LabelLike): string {
  return typeof label === 'function' ? label() : label;
}
