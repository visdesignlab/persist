import { createRender, useModelState } from '@anywidget/react';
import { useHookstate } from '@hookstate/core';
import { Box } from '@mantine/core';
import { NodeId } from '@trrack/core';
import { ProvVis, ProvVisConfig } from '@trrack/vis-react';
import React, { useEffect, useMemo } from 'react';
import { TrrackableCell } from '../../cells';
import { Interactions } from '../../interactions/interaction';
import { withTrrackableCell } from '../utils/useCell';
import {
  Events,
  TrrackState,
  getInteractionsFromRoot,
  useTrrack
} from './manager';

type Props = {
  cell: TrrackableCell;
};

function Trrack({ cell }: Props) {
  const [trrackModel, setTrrackModel] = useModelState<string>('trrack');
  const [, setInteractionsModel] = useModelState<Interactions>('interactions');
  const { trrack } = useTrrack(cell);
  const current = useHookstate(trrack.current.id);

  // Sync the widget model trrack with one retrieved from the cell metadata
  useEffect(() => {
    const tgm = trrackModel ? (JSON.parse(trrackModel).root as NodeId) : null;

    if (!tgm || tgm !== trrack.root.id) {
      setTrrackModel(trrack.export());
    }

    const unsubscribe = trrack.currentChange(() => {
      setTrrackModel(trrack.export());
    });

    return () => {
      unsubscribe();
    };
  }, [trrack, trrackModel]);

  // Update current node
  useEffect(() => {
    const unsub = trrack.currentChange(() => {
      current.set(trrack.current.id);
      const inters = getInteractionsFromRoot(trrack, trrack.current.id);

      setInteractionsModel(inters);
    });

    return () => {
      unsub();
    };
  }, [current, trrack]);

  const trrackConfig: Partial<ProvVisConfig<TrrackState, Events>> =
    useMemo(() => {
      return {
        changeCurrent: (nodeId: NodeId) => {
          trrack.to(nodeId);
        },
        bookmarkNode: null,
        labelWidth: 100,
        verticalSpace: 25,
        marginTop: 25,
        gutter: 25,
        marginLeft: 15,
        animationDuration: 200,
        annotateNode: null
      };
    }, [current.value, trrack]);

  return (
    <Box
      sx={{
        minHeight: '200px'
      }}
    >
      <ProvVis
        root={trrack.root.id}
        currentNode={current.value}
        nodeMap={trrack.graph.backend.nodes as any}
        config={trrackConfig}
      />
    </Box>
  );
}

export const render = createRender(withTrrackableCell(Trrack));
