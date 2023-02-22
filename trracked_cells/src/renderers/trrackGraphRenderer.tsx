import { ReactWidget } from '@jupyterlab/apputils';
import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { Button } from '@jupyterlab/ui-components';
import { PanelLayout } from '@lumino/widgets';
import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import React, { FC, useEffect, useState } from 'react';
import { TrrackManager } from '../trrack/manager';
import { TRRACK_GRAPH_MIME_TYPE } from './mimetypes';

type TrrackVisProps = {
  manager: TrrackManager;
};

const TrrackVisComponent: FC<TrrackVisProps> = ({ manager }) => {
  const { trrack } = manager;
  const [current, setCurrent] = useState(trrack.current.id);

  const { verticalSpace, marginTop, gutter } = {
    verticalSpace: 25,
    marginTop: 25,
    gutter: 25
  };

  useEffect(() => {
    return trrack.currentChange(() => {
      setCurrent(trrack.current.id);
    });
  }, [trrack]);

  return (
    <ProvVis
      root={trrack.root.id}
      config={{
        changeCurrent: (node: NodeId) => trrack.to(node),
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
};

class TrrackVisWidget extends ReactWidget {
  constructor(private props: TrrackVisProps) {
    super();
  }

  render() {
    const { manager } = this.props;
    const { trrack, actions } = manager;

    return (
      <>
        <div>
          <Button
            onClick={() => {
              const str = Math.random().toString(36).substring(2, 5);
              trrack.apply(`Random update to: ${str}`, actions.testAction(str));
            }}
          >
            Add random msg
          </Button>
          <Button onClick={() => manager.reset()}>Reset</Button>
        </div>
        <TrrackVisComponent {...this.props} />
      </>
    );
  }
}

export class RenderedTrrackGraph extends RenderedCommon {
  constructor(_options: IRenderMime.IRendererOptions) {
    super(_options);
    this.layout = new PanelLayout();
  }

  render(model: IRenderMime.IMimeModel): Promise<void> {
    const trrackId = model.data[TRRACK_GRAPH_MIME_TYPE];

    if (!trrackId || typeof trrackId !== 'string') return Promise.resolve();

    const manager = window.trrackMap.get(trrackId);

    if (!manager) return Promise.resolve();

    const widget = new TrrackVisWidget({ manager });

    (this.layout as PanelLayout).addWidget(widget);

    return Promise.resolve();
  }
}
