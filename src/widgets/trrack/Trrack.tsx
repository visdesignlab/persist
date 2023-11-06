import { useModelState } from '@anywidget/react';
import { useHookstate, useHookstateEffect } from '@hookstate/core';
import { Badge, Card, Group, Text, Tooltip } from '@mantine/core';
import { NodeId, Trrack } from '@trrack/core';
import { ProvVis, ProvVisConfig } from '@trrack/vis-react';
import React, { useMemo } from 'react';
import { TrrackableCell } from '../../cells';
import { Interactions } from '../../interactions/interaction';
import { GeneratedRecord } from '../utils/dataframe';
import { TrrackEvents, TrrackGraph, TrrackState } from './types';
import { getInteractionsFromRoot } from './utils';

type Props = {
  cell: TrrackableCell;
  setCurrentNodeTarget: (ref: Element | null) => void;
  scroll: () => void;
};

export function Trrack({ cell, setCurrentNodeTarget, scroll }: Props) {
  const manager = cell.trrackManager;
  const [trrackModel, setTrrackModel] = useModelState<TrrackGraph>('trrack'); // Get trrack state from model
  const [, setInteractionsModel] = useModelState<Interactions>('interactions'); // Get interactions state from model
  const current = useHookstate(manager.trrack.current.id); // Trrack current change
  const [generatedDataframeRecord = {}] = useModelState<GeneratedRecord>(
    'generated_dataframe_record'
  );

  const root = useHookstate(manager.trrack.root.id);

  // Sync the widget model trrack with one retrieved from the cell metadata
  useHookstateEffect(() => {
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

      setTimeout(() => {
        const currentNode = document.querySelector(
          `[data-node-id="${current.value}"]`
        );
        setCurrentNodeTarget(currentNode);
        scroll();
      }, 200);

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
  }, [cell, trrackModel, current, scroll, setCurrentNodeTarget]);

  const trrackConfig: Partial<ProvVisConfig<TrrackState, TrrackEvents>> =
    useMemo(() => {
      const dataframeKeys = Object.keys(generatedDataframeRecord);

      const nodeOnlyDataframes = dataframeKeys.filter(
        d => generatedDataframeRecord[d]?.current_node_id === current.value
      );

      const dataframeNameList = [...nodeOnlyDataframes].sort();

      function getColor(dfName: string) {
        const regularDfColor = 'blue';
        const groupedDfColor = 'yellow';
        const dynamicDfColor = 'grape';

        if (dfName.includes('_dyn')) {
          return dynamicDfColor;
        }

        if (dfName.includes('_grouped')) {
          return groupedDfColor;
        }

        return regularDfColor;
      }

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
          '*':
            dataframeNameList.length > 0 ? (
              <Card shadow="xl" withBorder>
                <Text component="span">
                  <strong>Dataframes: </strong>
                </Text>

                <Group spacing="5px">
                  {dataframeNameList.map(dfName => (
                    <Tooltip key={dfName} label={dfName} openDelay={300}>
                      <Badge
                        maw="70px"
                        variant="outline"
                        size="xs"
                        color={getColor(dfName)}
                        sx={{ cursor: 'pointer' }}
                        styles={theme => ({
                          root: {
                            '&:hover': theme.fn.hover({
                              transform: 'scale(1)'
                            })
                          }
                        })}
                      >
                        <Text truncate>{dfName}</Text>
                      </Badge>
                    </Tooltip>
                  ))}
                </Group>
              </Card>
            ) : null
        }
      };
    }, [current.value, manager, generatedDataframeRecord]);

  return (
    <ProvVis
      root={manager.trrack.root.id}
      currentNode={current.value}
      nodeMap={manager.trrack.exportObject().nodes}
      config={trrackConfig}
    />
  );
}

// export const render = createRender(withTrrackableCell(Trrack));
