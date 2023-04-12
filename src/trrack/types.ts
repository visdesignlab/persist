import { Trrack as T } from '@trrack/core';
import { Filter, Interaction, Interactions, SelectionInterval } from '../types';

export type TrrackState = {
  interactions: Interactions;
};

export type PlotEvent<M = Interaction> = M extends Interaction
  ? M['type']
  : never;

export type Trrack = T<TrrackState, PlotEvent<Interaction>>;

export type TrrackActions = {
  addIntervalSelection: (
    selection: SelectionInterval,
    label?: LabelLike
  ) => Promise<void>;
  addFilter: (filter: Filter, label?: LabelLike) => Promise<void>;
};

export type LabelLike = string | (() => string);
