import {
  NodeId,
  Registry,
  Trrack,
  initializeTrrack,
  isRootNode
} from '@trrack/core';
import { ISignal, Signal } from '@lumino/signaling';
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
  const notifyTrrackInstanceChange: Signal<TrrackableCell, TrrackProvenance> =
    new Signal(cell);

  const registry = Registry.create();

  const addInteractionAction = registry.register(
    'interaction',
    (_, interaction: Interaction) => {
      return interaction;
    }
  );

  let trrack = initializeTrrack<TrrackState, Events>({
    registry,
    initialState: defaultTrrackState
  });

  if (graphToLoad) {
    trrack.importObject(graphToLoad);
  }

  cell.trrackGraphState.set(trrack.exportObject());

  let unsubscribe = trrack.currentChange(() => {
    cell.trrackGraphState.set(trrack.exportObject());
    window.Persist.Commands.registry.notifyCommandChanged();
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
    reset() {
      unsubscribe();
      trrack = initializeTrrack<TrrackState, Events>({
        registry,
        initialState: defaultTrrackState
      });

      unsubscribe = trrack.currentChange(() => {
        cell.trrackGraphState.set(trrack.exportObject());
        window.Persist.Commands.registry.notifyCommandChanged();
      });
      cell.trrackGraphState.set(trrack.exportObject());
      window.Persist.Commands.registry.notifyCommandChanged();
      notifyTrrackInstanceChange.emit(trrack);
    },
    select(action: SelectionAction, label: LabelLike) {
      return apply(action, label);
    }
  };

  notifyTrrackInstanceChange.emit(trrack);

  return {
    get trrack() {
      return trrack;
    },
    get apply() {
      return apply;
    },
    get unsubscribe() {
      return unsubscribe;
    },
    get actions() {
      return actions;
    },
    get trrackInstanceChange(): ISignal<TrrackableCell, TrrackProvenance> {
      return notifyTrrackInstanceChange;
    }
  };
}

export function useTrrack(cell: TrrackableCell) {
  const trrackGraph = cell.trrackGraph;

  const { trrack, apply, actions, trrackInstanceChange } = createTrrackInstance(
    stripImmutableClone(trrackGraph),
    cell
  );

  cell.trrack = trrack;
  cell.trrackActions = actions;

  return { trrack, apply, trrackInstanceChange };
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
