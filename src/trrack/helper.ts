import { PayloadAction } from '@reduxjs/toolkit';
import { LabelLike, Trrack } from './types';

export function getLabelFromLabelLike(label: LabelLike): string {
  return typeof label === 'function' ? label() : label;
}

export async function applyAddInteraction(
  trrack: Trrack,
  label: string,
  interaction: PayloadAction
): Promise<void> {
  return Promise.resolve(trrack.apply(label, interaction));
}
