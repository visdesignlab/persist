import { createAction, initializeTrrack, Registry } from '@trrack/core';

type State = {
  msg: string;
  sels: any[];
};

const initialState: State = {
  msg: 'Hello, World!',
  sels: []
};

type Options = State | string;

function setupTrrack(loadFrom?: Options) {
  const registry = Registry.create();

  const testAction = registry.register('test', (state, msg) => {
    state.msg = msg;
  });

  const selectionAction = registry.register('select', (state, sel) => {
    state.sels = [...state.sels, sel];
  });

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
      selectionAction
    }
  };
}

export type Trrack = ReturnType<typeof setupTrrack>['trrack'];

export type TrrackActions = ReturnType<typeof setupTrrack>['actions'];

export const defaultActions: TrrackActions = {
  testAction: createAction('test'),
  selectionAction: createAction('select')
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
