import { initializeTrrack, Registry } from '@trrack/core';
import { Interactions } from '../interactions/types';
import { applyAddInteraction, getLabelFromLabelLike } from './helper';
import {
  Trrack as _Trrack,
  LabelLike,
  PlotEvent,
  TrrackActions,
  TrrackState
} from './types';

type Options = TrrackState | string;

export type Trrack = _Trrack;

function setupTrrack(loadFrom?: Options): {
  trrack: Trrack;
  actions: TrrackActions;
} {
  const registry = Registry.create();

  const addInteractionAction = registry.register(
    'interaction',
    (state, sel) => {
      state.interactions.push(sel);
    }
  );

  let trrack = initializeTrrack<TrrackState, PlotEvent>({
    registry,
    initialState: {
      interactions: []
    }
  });

  if (loadFrom && typeof loadFrom === 'string') {
    trrack.import(loadFrom);
  } else if (loadFrom && typeof loadFrom !== 'string') {
    trrack = initializeTrrack<TrrackState, PlotEvent>({
      registry,
      initialState: loadFrom
    });
  }

  return {
    trrack,
    actions: {
      async addIntervalSelection(
        selection: Interactions.SelectionInterval,
        label: LabelLike = 'Brush Selection'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addInteractionAction(selection)
        );
      },
      async addFilter(
        filter: Interactions.Filter,
        label: LabelLike = 'Filter'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addInteractionAction(filter)
        );
      },
      async addAggregate(
        agg: Interactions.Aggregate,
        label: LabelLike = 'Aggregate'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addInteractionAction(agg)
        );
      }
    }
  };
}

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

export namespace Trrack {
  export function create(savedGraph: string | undefined) {
    return setupTrrack(savedGraph);
  }
}
