import { TrrackableCell } from '../cells';
import { LabelLike } from '../widgets/trrack/labelGen';

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
