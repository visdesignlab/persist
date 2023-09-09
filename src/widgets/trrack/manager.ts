import {
  NodeId,
  Registry,
  Trrack,
  initializeTrrack,
  isRootNode
} from '@trrack/core';
import { TrrackableCell } from '../../cells';
import { Interaction } from '../../interactions/interaction';
import { SelectionAction } from '../../interactions/selection';
import { Nullable } from '../../utils/nullable';
import { stripImmutableClone } from '../../utils/stripImmutableClone';
import { UUID } from '../../utils/uuid';
import { LabelLike, getLabelFromLabelLike } from './labelGen';

export type TrrackState = Interaction;

export type Events = Interaction['type'];

export type TrrackProvenance = Trrack<TrrackState, Events>;

export type TrrackGraph = TrrackProvenance['graph']['backend'];

export type TrrackActions = ReturnType<typeof createTrrackInstance>['actions'];

const defaultTrrackState: TrrackState = {
  id: UUID(),
  type: 'create'
};

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

  async function apply<T extends Interaction = Interaction>(
    interaction: T,
    label: LabelLike
  ) {
    await trrack.apply(
      getLabelFromLabelLike(label),
      addInteractionAction(interaction)
    );
  }

  const actions = {
    select(action: SelectionAction, label: LabelLike) {
      return apply(action, label);
    }
  };

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

export function getInteractionsFromRoot(
  trrack: TrrackProvenance,
  till: NodeId = trrack.current.id
) {
  const ids: NodeId[] = [];
  const nodes = trrack.graph.backend.nodes;

  let node = nodes[till];

  while (!isRootNode(node)) {
    ids.push(node.id);
    node = nodes[node.parent];
  }

  ids.push(trrack.root.id);
  ids.reverse();

  return ids.map(i => nodes[i]).map(node => trrack.getState(node));
}
