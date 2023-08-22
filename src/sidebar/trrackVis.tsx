import { useHookstate } from '@hookstate/core';
import { Text } from '@mantine/core';
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

  const graphDataframe = useHookstate(cell.generatedDataframes.graphDataframes);
  const graphDataframeName = graphDataframe.ornull?.name.get() || null;

  const nodeDataframes = useHookstate(cell.generatedDataframes.nodeDataframes);
  const nodeDataframeName =
    nodeDataframes.nested(current).ornull?.name.get() || null;

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
    const dataframeNames = [];
    if (graphDataframeName) {
      dataframeNames.push(graphDataframeName);
    }

    if (nodeDataframeName) {
      dataframeNames.push(nodeDataframeName);
    }

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
      changeCurrent: (node: NodeId) => {
        trrack.to(node);
      },
      bookmarkNode: null,
      labelWidth: 100,
      verticalSpace,
      marginTop,
      marginLeft: 15,
      gutter,
      animationDuration: 200,
      annotateNode: null,
      nodeExtra: {
        '*': dataframeNameDisp
      }
    };
  }, [current, commandRegistry, trrack, graphDataframeName, nodeDataframeName]);

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
