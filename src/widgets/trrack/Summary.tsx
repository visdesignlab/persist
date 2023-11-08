import React, { useEffect, useState } from 'react';
import { Alert, List } from '@mantine/core';
import { TrrackEvents, TrrackProvenance, TrrackState } from './types';
import { NodeId, ProvenanceNode, isStateNode } from '@trrack/core';

type Props = {
  trrack: TrrackProvenance;
  current: NodeId;
};

export function Summary({ trrack, current }: Props) {
  const [nodes, setNodes] = useState<
    ProvenanceNode<TrrackState, TrrackEvents>[]
  >([]);

  useEffect(() => {
    let nodeId = current;
    let nodeIds: NodeId[] = [];

    while (nodeId !== trrack.root.id) {
      nodeIds.push(nodeId);
      const node = trrack.graph.backend.nodes[nodeId];
      if (isStateNode(node)) {
        nodeId = node.parent;
      }
    }

    if (nodeIds.includes(trrack.root.id)) {
      nodeIds = nodeIds.filter(n => n !== trrack.root.id);
    }

    nodeIds.reverse();

    const provenanceNodes = nodeIds.map(n => trrack.graph.backend.nodes[n]);
    setNodes(provenanceNodes);
  }, [trrack, current]);

  return (
    <List>
      {nodes.length === 0 && (
        <Alert color="gray" ta="center">
          Start interacting with the output to see a summary of your actions
          till now.
        </Alert>
      )}
      {nodes.map(node => {
        return <List.Item key={node.id}>{node.label}</List.Item>;
      })}
    </List>
  );
}
