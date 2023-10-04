import { NodeId, isRootNode } from '@trrack/core';
import { TrrackProvenance } from './types';
import { Interaction } from '../../interactions/interaction';

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
export function isAnySelectionInteraction(interaction: Interaction) {
  return interaction.type === 'select';
}
