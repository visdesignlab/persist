import { initializeTrrack, Registry } from '@trrack/core';
import { Interactions } from '../interactions/types';
import uuid from '../utils/uuid';
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
    (_, interaction) => {
      return interaction;
    }
  );

  const addSelectionAction = registry.register('selection', (_, selection) => {
    return selection;
  });

  let trrack = initializeTrrack<TrrackState, PlotEvent>({
    registry,
    initialState: {
      id: uuid(),
      type: 'create'
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
      async addSelection(
        selection: Interactions.SelectionAction,
        label: LabelLike = 'Brush Selection'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addSelectionAction(selection)
        );
      },
      async addFilter(
        filter: Interactions.FilterAction,
        label: LabelLike = 'Filter'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addInteractionAction(filter)
        );
      },
      async addAggregate(
        agg: Interactions.AggregateAction,
        label: LabelLike = 'Aggregate'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addInteractionAction(agg)
        );
      },
      async addCategory(
        cat: Interactions.CategoryAction,
        label: LabelLike = 'Categorize'
      ) {
        return await applyAddInteraction(
          trrack,
          getLabelFromLabelLike(label),
          addInteractionAction(cat)
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
