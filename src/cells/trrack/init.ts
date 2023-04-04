import { createAction, initializeTrrack, Registry } from '@trrack/core';
import { Interaction, Interactions } from '../../types';

export type PlotEvent<M = Interaction> = M extends Interaction
  ? M['type']
  : never;

export type State = {
  interactions: Interactions;
};

type Options = State | string;

function setupTrrack(loadFrom?: Options) {
  const registry = Registry.create();

  const addInteractionAction = registry.register(
    'interaction',
    (state, sel) => {
      state.interactions.push(sel);
    }
  );

  let trrack = initializeTrrack<State, PlotEvent>({
    registry,
    initialState: {
      interactions: []
    }
  });

  if (loadFrom && typeof loadFrom === 'string') {
    trrack.import(loadFrom);
  } else if (loadFrom && typeof loadFrom !== 'string') {
    trrack = initializeTrrack<State, PlotEvent>({
      registry,
      initialState: loadFrom
    });
  }

  return {
    trrack,
    actions: {
      addInteractionAction
    }
  };
}

export type Trrack = ReturnType<typeof setupTrrack>['trrack'];

export type TrrackActions = ReturnType<typeof setupTrrack>['actions'];

export const defaultActions: TrrackActions = {
  addInteractionAction: createAction('select')
};

/**
 * A namespace for Trrack statics.
 */
export class TrrackOps {
  /**
   * Create a Trrack and TrrackActions for a cell
   * @returns Trrack instance and actions
   */
  static create(savedGraph: string | undefined) {
    return setupTrrack(savedGraph);
  }
}
