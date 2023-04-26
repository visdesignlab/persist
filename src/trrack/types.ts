import { Trrack as T } from '@trrack/core';
import { Interaction, Interactions } from '../interactions/types';

export type TrrackState = {
  interactions: Interactions;
};

export type PlotEvent<M = Interaction> = M extends Interaction
  ? M['type']
  : never;

export type Trrack = T<TrrackState, PlotEvent<Interaction>>;

export type TrrackActions = {
  addIntervalSelection: (
    selection: Interactions.IntervalSelectionAction,
    label?: LabelLike
  ) => Promise<void>;
  addSingleSelection: (
    selection: Interactions.SingleSelectionAction,
    label?: LabelLike
  ) => Promise<void>;
  addFilter: (
    filter: Interactions.FilterAction,
    label?: LabelLike
  ) => Promise<void>;
  addAggregate: (
    agg: Interactions.AggregateAction,
    label?: LabelLike
  ) => Promise<void>;
};

export type LabelLike = string | (() => string);
