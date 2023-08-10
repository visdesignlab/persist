import { Box, Stack } from '@mantine/core';
import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import { select } from 'd3-selection';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { TrrackableCell } from '../cells';
import { ExtractDataBtn } from '../cells/output/ExtractDataBtn';
import { OutputCommandRegistry } from '../cells/output/commands';
import { TrrackCurrentChange } from '../trrack';
import { TrrackVisConfig } from '../trrack/types';

export type TrrackVisProps = {
  cell: TrrackableCell;
};

export function TrrackVisComponent(props: TrrackVisProps): JSX.Element {
  const { cell } = props;
  const manager = cell.trrackManager;
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

        if (df && !newContent.includes(df)) {
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
        selection: <Stack spacing={4}>-</Stack>,
        note: (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        label: (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        create: (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        filter: (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        aggregate: (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        categorize: (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        'rename-column': (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        'drop-columns': (
          <Stack>
            <Box>-</Box>
          </Stack>
        ),
        intent: (
          <Stack>
            <Box>-</Box>
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
