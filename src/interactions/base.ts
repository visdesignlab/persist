import { TrrackableCell } from '../cells';

import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { LabelLike } from '../widgets/trrack/labelGen';
import { castArgs } from '../utils/castArgs';
import { isAnySelectionInteraction } from '../widgets/trrack/manager';

export type BaseInteraction = {
  id: string;
  type: unknown;
};

export type ActionAndLabelLike<T extends BaseInteraction> = {
  action: T;
  label: LabelLike;
};

export type BaseCommandArg = {
  cell: TrrackableCell;
};

export function hasSelections(args: ReadonlyPartialJSONObject) {
  const { cell } = castArgs<BaseCommandArg>(args);

  const trrack = cell.trrack;

  if (!trrack) {
    return false;
  }

  const interaction = trrack.getState();

  return isAnySelectionInteraction(interaction);
}
