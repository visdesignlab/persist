import { Trrack } from '@trrack/core';
import { Interaction } from '../../interactions/interaction';

export type TrrackState = Interaction;

export type TrrackEvents = Interaction['type'];

export type TrrackProvenance = Trrack<TrrackState, TrrackEvents>;
export type TrrackGraph = TrrackProvenance['graph']['backend'];
