import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import { select } from 'd3-selection';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ExtractDataBtn } from '../cells/output/ExtractDataBtn';
import { TrrackableCell } from '../cells/trrackableCell';
import { TrrackCurrentChange } from './manager';

export type TrrackVisProps = {
  cell: TrrackableCell;
};

export function TrrackVisComponent({ cell }: TrrackVisProps): JSX.Element {
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
      setCurrent(currentNode);
    };

    manager.currentChange.connect(fn);
    return () => {
      manager.currentChange.disconnect(fn);
    };
  }, [manager]);

  useEffect(() => {
    const div = ref.current;
    if (!div) return;

    const trrackRef = select(div);

    const nodeLabels = trrackRef.selectAll('.node-description');

    const dfButtons = nodeLabels.selectAll('.extract-btn').data([null]);

    const btnDiv = dfButtons.join('div').classed('extract-btn', true);

    const unMountList: Array<() => boolean> = [];

    btnDiv.each(function () {
      const div = this as HTMLDivElement;

      if (!div) return;
      const nodeId = select(div.parentElement).attr('data-node-id');

      const unMount = () => ReactDOM.unmountComponentAtNode(div);
      unMountList.push(unMount);
      ReactDOM.render(<ExtractDataBtn cell={cell} id={nodeId} />, div);
    });

    return () => unMountList.forEach(fn => fn());
  });

  return (
    <div ref={ref}>
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
          gutter,
          animationDuration: 200
        }}
        nodeMap={trrack.graph.backend.nodes as any}
        currentNode={current}
      />
    </div>
  );
}
