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
  TrrackGraph,
  TrrackProvenance,
  TrrackState,
  getInteractionsFromRoot,
  useTrrack
} from './manager';
import { UseSignal } from '@jupyterlab/apputils';

type Props = {
  cell: TrrackableCell;
  trrack: TrrackProvenance;
};

function Trrack({ trrack }: Props) {
  const [trrackModel, setTrrackModel] = useModelState<TrrackGraph>('trrack');
  const [, setInteractionsModel] = useModelState<Interactions>('interactions');
  const current = useHookstate(trrack.current.id);

  // Sync the widget model trrack with one retrieved from the cell metadata
  useEffect(() => {
    const tgm = trrackModel ? trrackModel.root : null;

    if (!tgm || tgm !== trrack.root.id) {
      setTrrackModel(trrack.exportObject());
      const interactions = getInteractionsFromRoot(trrack, trrack.current.id);
      setInteractionsModel(interactions);
    }

    const unsubscribe = trrack.currentChange(() => {
      setTrrackModel(trrack.exportObject());
    });

    return () => {
      unsubscribe();
    };
  }, [trrack, trrackModel]);

  // Update current node
  useEffect(() => {
    const fn = () => {
      current.set(trrack.current.id);
      const inters = getInteractionsFromRoot(trrack, trrack.current.id);

      setInteractionsModel(inters);
    };

    const unsub = trrack.currentChange(fn);

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

function wrapper({ cell }: { cell: TrrackableCell }) {
  const { trrack: t, trrackInstanceChange } = useTrrack(cell);

  return (
    <UseSignal initialArgs={t} signal={trrackInstanceChange}>
      {(_, trrack) =>
        trrack && <Trrack key={trrack.root.id} cell={cell} trrack={trrack} />
      }
    </UseSignal>
  );
}

export const render = createRender(withTrrackableCell(wrapper));
