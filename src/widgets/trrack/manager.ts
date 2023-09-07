import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import { TrrackableCell } from '../../cells';
import { Nullable } from '../../utils/nullable';
import { stripImmutableClone } from '../../utils/stripImmutableClone';

type Interaction = any;

export type TrrackState = {
  interaction: Interaction;
};

export type Events = 'create';

export type TrrackProvenance = Trrack<TrrackState, Events>;

export type TrrackGraph = TrrackProvenance['graph']['backend'];

export type TrrackActions = ReturnType<typeof createTrrackInstance>['actions'];

const defaultTrrackState: TrrackState = {
  interaction: 'hello'
};

type LabelLike = string | (() => string);

export function getLabelFromLabelLike(label: LabelLike): string {
  return typeof label === 'function' ? label() : label;
}

export function createTrrackInstance(
  graphToLoad: Nullable<TrrackGraph>,
  cell: TrrackableCell
) {
  const registry = Registry.create();

  const addInteractionAction = registry.register(
    'interaction',
    (_, interaction: Interaction) => {
      return interaction;
    }
  );

  const trrack = initializeTrrack<TrrackState, Events>({
    registry,
    initialState: defaultTrrackState
  });

  if (graphToLoad) {
    trrack.importObject(graphToLoad);
  }

  cell.trrackGraphState.set(trrack.exportObject());
  const unsubscribe = trrack.currentChange(() => {
    cell.trrackGraphState.set(trrack.exportObject());
  });

  function apply(label: string, interaction: Interaction) {
    return trrack.apply(label, addInteractionAction(interaction));
  }

  const actions = {};

  return { trrack, apply, unsubscribe, actions };
}

export function useTrrack(cell: TrrackableCell) {
  const trrackGraph = cell.trrackGraph;

  const { trrack, apply, actions } = createTrrackInstance(
    stripImmutableClone(trrackGraph),
    cell
  );

  cell.trrack = trrack;
  cell.trrackActions = actions;

  return { trrack, apply };
}
