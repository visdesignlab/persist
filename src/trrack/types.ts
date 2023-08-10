import { NodeId, Trrack as T } from '@trrack/core';
import { ProvVisConfig } from '@trrack/vis-react';
import { Interaction, Interactions } from '../interactions/types';

export type TrrackState = Interaction;

export type PlotEvent<M = Interaction> = M extends Interaction
  ? M['type']
  : never;

export type Trrack = T<TrrackState, PlotEvent<Interaction>>;
export type TrrackGraph = Trrack['graph']['backend'];
export type TrrackNode = Trrack['graph']['backend']['nodes'][NodeId];
export type TrrackVisConfig = ProvVisConfig<
  TrrackState,
  PlotEvent<Interaction>
>;

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
  addCategory: (
    agg: Interactions.CategoryAction,
    label?: LabelLike
  ) => Promise<void>;
  addLabel: (
    labelAction: Interactions.LabelAction,
    label?: LabelLike
  ) => Promise<void>;
  addNote: (note: Interactions.NotesAction, label?: LabelLike) => Promise<void>;
  addIntentSelection: (
    intent: Interactions.IntentSelectionAction,
    label?: LabelLike
  ) => Promise<void>;
  addRenameColumnInteraction: (
    intent: Interactions.RenameColumnAction,
    label?: LabelLike
  ) => Promise<void>;
  addDropColumnInteraction: (
    intent: Interactions.DropColumnAction,
    label?: LabelLike
  ) => Promise<void>;
};

export type LabelLike = string | (() => string);
