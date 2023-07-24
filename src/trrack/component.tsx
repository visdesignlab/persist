import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import { select } from 'd3-selection';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ExtractDataBtn } from '../cells/output/ExtractDataBtn';
import { TrrackableCell } from '../cells/trrackableCell';
import { TrrackCurrentChange } from './manager';
import {
  Button,
  ColorSwatch,
  Popover,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import { CommandButton } from '../components/CommandButton';
import {
  OutputCommandIds,
  OutputCommandRegistry
} from '../cells/output/commands';

export type TrrackVisProps = {
  cell: TrrackableCell;
};

export function TrrackVisComponent(props: TrrackVisProps): JSX.Element {
  const { cell } = props;
  const manager = cell.trrackManager;
  const cellRef = useRef(cell);
  const { trrack } = manager;
  const [current, setCurrent] = useState(trrack.current.id);
  const ref = useRef<HTMLDivElement>(null);

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
    manager.trrack.to(manager.current);

    return () => {
      manager.currentChange.disconnect(fn);
    };
  }, [manager]);

  useEffect(() => {
    const div = ref.current;
    if (!div) {
      return;
    }

    const trrackRef = select(div);

    const nodeLabels = trrackRef.selectAll('.node-description');

    const dfButtons = nodeLabels.selectAll('.extract-btn').data([null]);

    const btnDiv = dfButtons.join('div').classed('extract-btn', true);

    const unMountList: Array<() => boolean> = [];

    btnDiv.each(function () {
      const div = this as HTMLDivElement;

      if (!div) {
        return;
      }
      const nodeId = select(div.parentElement).attr('data-node-id');

      const unMount = () => ReactDOM.unmountComponentAtNode(div);
      unMountList.push(unMount);
      ReactDOM.render(<ExtractDataBtn cell={cell} id={nodeId} />, div);
    });

    return () => unMountList.forEach(fn => fn());
  });

  const commandRegistry = useMemo(() => {
    return new OutputCommandRegistry(cell);
  }, []);

  const trrackConfig = useMemo(() => {
    return {
      changeCurrent: (node: NodeId) => {
        trrack.to(node);
      },
      nodeExtra: {
        selection: (
          <Stack spacing={4}>
            <Button
              styles={{ inner: { justifyContent: 'start' } }}
              compact
              size="xs"
              style={{ width: '100%' }}
              variant="subtle"
              onClick={e => {
                commandRegistry.commands.execute(OutputCommandIds.filter);
                e.stopPropagation();
              }}
            >
              Filter
            </Button>
            <Button
              compact
              styles={{ inner: { justifyContent: 'start' } }}
              size="xs"
              style={{ width: '100%' }}
              variant="subtle"
              onClick={e => {
                commandRegistry.commands.execute(OutputCommandIds.aggregate);
                e.stopPropagation();
              }}
            >
              Aggregate
            </Button>
            <Popover
              width={150}
              position="bottom"
              withArrow
              withinPortal
              shadow="md"
            >
              <Popover.Target>
                <Button
                  compact
                  styles={{ inner: { justifyContent: 'start' } }}
                  size="xs"
                  style={{ width: '100%' }}
                  variant="subtle"
                >
                  Categorize
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack>
                  <Text weight={700}>Select a category</Text>
                  {cellRef.current.categories.map(cat => {
                    return (
                      <Button
                        styles={{ inner: { justifyContent: 'start' } }}
                        size="xs"
                        leftIcon={
                          <ColorSwatch
                            size="10"
                            color={cellRef.current.categoryColorScale(cat)}
                          ></ColorSwatch>
                        }
                        onClick={e => {
                          commandRegistry.commands.execute(
                            OutputCommandIds.categorize
                          );
                          e.stopPropagation();
                        }}
                        variant="light"
                      >
                        <Tooltip withinPortal label={cat}>
                          <Text size={12}>{cat}</Text>
                        </Tooltip>
                      </Button>
                    );
                  })}
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Stack>
        )
      },
      bookmarkNode: null,
      labelWidth: 100,
      verticalSpace,
      marginTop,
      marginLeft: 15,
      gutter,
      animationDuration: 200,
      annotateNode: null
    };
  }, [current, commandRegistry, trrack, cell.categories]);

  return (
    <div style={{ height: '100%' }}>
      <div>Controls</div>
      <div style={{ height: '100%' }} ref={ref}>
        <ProvVis
          root={trrack.root.id}
          config={trrackConfig}
          nodeMap={trrack.graph.backend.nodes as any}
          currentNode={current}
        />
      </div>
    </div>
  );
}
