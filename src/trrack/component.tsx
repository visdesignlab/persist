import { Box, Button, Popover, Stack, Text, Tooltip } from '@mantine/core';
import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import { select } from 'd3-selection';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ExtractDataBtn } from '../cells/output/ExtractDataBtn';
import {
  OutputCommandIds,
  OutputCommandRegistry
} from '../cells/output/commands';
import { TrrackableCell } from '../cells/trrackableCell';
import { useCategoryManager } from '../notebook/categories/manager';
import { TrrackCurrentChange } from './manager';
import { TrrackVisConfig } from './types';

export type TrrackVisProps = {
  cell: TrrackableCell;
};

export function TrrackVisComponent(props: TrrackVisProps): JSX.Element {
  const { cell } = props;
  const manager = cell.trrackManager;
  const { trrack } = manager;
  const [current, setCurrent] = useState(trrack.current.id);
  const ref = useRef<HTMLDivElement>(null);

  const cm = useCategoryManager();

  const { verticalSpace, marginTop, gutter } = {
    verticalSpace: 25,
    marginTop: 25,
    gutter: 25
  };

  useEffect(() => {
    const fn = (_: unknown, { currentNode }: TrrackCurrentChange) => {
      setCurrent(currentNode.id);
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

    // Hack way to add dfname
    nodeLabels.each(function () {
      const labelNode = select(this);

      const id = labelNode.attr('data-node-id');

      const df = cell.trrackManager.getVariableNameFromNodeMetadata(id);

      const l = labelNode.selectAll('p').data([null]);
      l.join('p').each(function () {
        const p = this as HTMLParagraphElement;

        if (!p) {
          return;
        }

        let newContent = p.textContent || '';

        if (df) {
          newContent = `(${df}) ${newContent}`;
        }

        p.textContent = newContent;
      });
    });

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

  const trrackConfig = useMemo((): Partial<TrrackVisConfig> => {
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
                commandRegistry.commands.execute(OutputCommandIds.aggregateSum);
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
                  {Object.values(cm.activeCategory()?.options || {}).map(
                    cat => {
                      return (
                        <Button
                          styles={{ inner: { justifyContent: 'start' } }}
                          size="xs"
                          onClick={e => {
                            commandRegistry.commands.execute(
                              OutputCommandIds.categorize
                            );
                            e.stopPropagation();
                          }}
                          variant="light"
                        >
                          <Tooltip withinPortal label={cat.name}>
                            <Text size={12}>{cat.name}</Text>
                          </Tooltip>
                        </Button>
                      );
                    }
                  )}
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Stack>
        ),
        note: (
          <Stack>
            <Box>Test</Box>
          </Stack>
        ),
        label: (
          <Stack>
            <Box>Test</Box>
          </Stack>
        ),
        create: (
          <Stack>
            <Box>Test</Box>
          </Stack>
        ),
        filter: (
          <Stack>
            <Box>Test</Box>
          </Stack>
        ),
        aggregate: (
          <Stack>
            <Box>Test</Box>
          </Stack>
        ),
        categorize: (
          <Stack>
            <Box>Test</Box>
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
  }, [current, commandRegistry, trrack]);

  return (
    <div style={{ height: '100%' }}>
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
