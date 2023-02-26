import { createAction, initializeTrrack, Registry } from '@trrack/core';
import { Interactions } from '../../types/interaction';

type State = {
  msg: string;
  interactions: Interactions;
};

const initialState: State = {
  msg: 'Hello, World!',
  interactions: []
};

type Options = State | string;

function setupTrrack(loadFrom?: Options) {
  const registry = Registry.create();

  const testAction = registry.register('test', (state, msg) => {
    state.msg = msg;
  });

  const addInteractionAction = registry.register(
    'interaction',
    (state, sel) => {
      state.interactions.push(sel);
    }
  );

  let trrack = initializeTrrack({
    registry,
    initialState
  });

  if (loadFrom && typeof loadFrom === 'string') {
    trrack.import(loadFrom);
  } else if (loadFrom && typeof loadFrom !== 'string') {
    trrack = initializeTrrack({
      registry,
      initialState: loadFrom
    });
  }

  return {
    trrack,
    actions: {
      testAction,
      addInteractionAction
    }
  };
}

export type Trrack = ReturnType<typeof setupTrrack>['trrack'];

export type TrrackActions = ReturnType<typeof setupTrrack>['actions'];

export const defaultActions: TrrackActions = {
  testAction: createAction('test'),
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
