import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import React, { useEffect, useState } from 'react';
import { ITrrackManager, TrrackCurrentChange } from './trrack/trrackManager';

export type TrrackVisProps = {
  manager: ITrrackManager;
};

export function TrrackVisComponent({ manager }: TrrackVisProps): JSX.Element {
  const { trrack } = manager;
  const [current, setCurrent] = useState(trrack.current.id);

  const { verticalSpace, marginTop, gutter } = {
    verticalSpace: 25,
    marginTop: 25,
    gutter: 25
  };

  useEffect(() => {
    const fn = (_: unknown, { currentNode }: TrrackCurrentChange) => {
      setCurrent(currentNode);
    };

    manager.currentChange.connect(fn);
    return () => {
      manager.currentChange.disconnect(fn);
    };
  }, [manager]);

  return (
    <ProvVis
      root={trrack.root.id}
      config={{
        changeCurrent: (node: NodeId) => {
          trrack.to(node);
        },
        labelWidth: 100,
        verticalSpace,
        marginTop,
        marginLeft: 15,
        gutter
      }}
      nodeMap={trrack.graph.backend.nodes}
      currentNode={current}
    />
  );
}
