import { createRender, useModelState } from '@anywidget/react';
import { useHookstate } from '@hookstate/core';
import { Box, Text } from '@mantine/core';
import { NodeId, Trrack } from '@trrack/core';
import { ProvVis, ProvVisConfig } from '@trrack/vis-react';
import React, { useEffect, useMemo, useState } from 'react';
import { TrrackableCell } from '../../cells';
import { Interactions } from '../../interactions/interaction';
import { withTrrackableCell } from '../utils/useCell';
import { getInteractionsFromRoot } from './utils';
import { TrrackEvents, TrrackGraph, TrrackState } from './types';
import { UPDATE } from '../header/CopyDFPopover';

type Props = {
  cell: TrrackableCell;
};

function Trrack({ cell }: Props) {
  const manager = cell.trrackManager;
  const [trrackModel, setTrrackModel] = useModelState<TrrackGraph>('trrack'); // Get trrack state from model
  const [, setInteractionsModel] = useModelState<Interactions>('interactions'); // Get interactions state from model
  const current = useHookstate(manager.trrack.current.id); // Trrack current change

  const root = useHookstate(manager.trrack.root.id);
  const [dataframeNames, setDataframeNames] = useState<string[]>([]);

  useEffect(() => {
    function f(_: unknown, names: string[]) {
      setDataframeNames(names);
    }

    UPDATE.connect(f);

    return () => {
      UPDATE.disconnect(f);
    };
  }, []);

  // Sync the widget model trrack with one retrieved from the cell metadata
  useEffect(() => {
    // Get root node of widget model if exsits
    const trrackWidgetModelRootId = trrackModel?.root ?? null;

    // Fn to update models
    function updateModels() {
      setTrrackModel(manager.trrack.exportObject()); // Save to model
      const interactions = getInteractionsFromRoot(manager.trrack); // Get list of interactions till now
      setInteractionsModel(interactions); // Save to model
    }

    // If root doesn't exist OR it is different from the one in the cell.
    // We replace it with the cell version
    if (
      !trrackWidgetModelRootId ||
      trrackWidgetModelRootId !== manager.trrack.root.id
    ) {
      updateModels();
    }

    // current node change listener which updates the model, and  sets new current
    function onCurrentNodeChange() {
      updateModels();
      current.set(manager.trrack.current.id);
    }
    function onInstanceChange() {
      root.set(manager.trrack.root.id);
      onCurrentNodeChange();
    }

    cell.trrackManager.currentChange.connect(onCurrentNodeChange);
    cell.trrackManager.trrackInstanceChange.connect(onInstanceChange);

    return () => {
      cell.trrackManager.currentChange.disconnect(onCurrentNodeChange);
      cell.trrackManager.trrackInstanceChange.disconnect(onInstanceChange);
    };
  }, [cell, trrackModel]);

  const trrackConfig: Partial<ProvVisConfig<TrrackState, TrrackEvents>> =
    useMemo(() => {
      const dataframeNameDisp =
        dataframeNames.length === 0 ? null : (
          <Text>
            <Text span fw="bold">
              Dataframes:{' '}
            </Text>{' '}
            {dataframeNames.join(', ')}
          </Text>
        );

      return {
        changeCurrent: (nodeId: NodeId) => {
          manager.trrack.to(nodeId);
        },
        bookmarkNode: null,
        labelWidth: 100,
        verticalSpace: 25,
        marginTop: 25,
        gutter: 25,
        marginLeft: 15,
        animationDuration: 200,
        annotateNode: null,
        nodeExtra: {
          '*': dataframeNameDisp
        }
      };
    }, [current.value, manager, dataframeNames]);

  return (
    <Box
      key={dataframeNames.join('-')}
      sx={{
        minHeight: '200px',
        height: '100%',
        minWidth: 300
      }}
    >
      <ProvVis
        root={manager.trrack.root.id}
        currentNode={current.value}
        nodeMap={manager.trrack.exportObject().nodes}
        config={trrackConfig}
      />
    </Box>
  );
}

export const render = createRender(withTrrackableCell(Trrack));
