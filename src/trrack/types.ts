import { Trrack as T } from '@trrack/core';
import { Interaction, Interactions } from '../interactions/types';

export type TrrackState = Interaction;

export type PlotEvent<M = Interaction> = M extends Interaction
  ? M['type']
  : never;

export type Trrack = T<TrrackState, PlotEvent<Interaction>>;

export type TrrackActions = {
  addSelection: (
    selection: Interactions.SelectionAction,
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
  addLabel: (
    labelAction: Interactions.LabelAction,
    label?: LabelLike
  ) => Promise<void>;
  addNote: (note: Interactions.NotesAction, label?: LabelLike) => Promise<void>;
};

export type LabelLike = string | (() => string);
