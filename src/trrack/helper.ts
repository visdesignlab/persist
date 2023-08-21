import { PayloadAction } from '@reduxjs/toolkit';
import { NodeId } from '@trrack/core';
import { stringifyForCode } from '../cells';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { Executor } from '../notebook';
import { Dataset } from '../vegaL/helpers';
import { TrrackManager } from './manager';
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

export async function getSelectionsFromTrrackManager(
  manager: TrrackManager,
  data: Dataset['values'],
  row_label: string,
  till?: NodeId
) {
  const interactions = getInteractionsFromRoot(manager, till);

  const code = Executor.withIDE(`
PR.get_selections(${stringifyForCode(data)}, ${stringifyForCode(
    interactions
  )}, "${row_label}")
`);

  const execResult = await Executor.execute(code);

  if (execResult.status === 'ok') {
    const selections = execResult.result as string[];

    return Promise.resolve(selections);
  } else {
    console.error(execResult.err);
    return Promise.resolve([]);
  }
}
