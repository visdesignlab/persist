import { ReactWidget } from '@jupyterlab/apputils';
import { Button } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import { NodeId } from '@trrack/core';
import { ProvVis } from '@trrack/vis-react';
import React, { FC, useEffect, useState } from 'react';

const TRX_OUTPUT_AREA_TRRACK_CLASS = 'trx-OutputArea-trrack';

export type TrrackVisProps = {
  trrack: any;
};

const TrrackVisComponent: FC<TrrackVisProps> = ({ trrack }) => {
  const [currentNode, setCurrentNode] = useState(trrack.current.id);

  const { verticalSpace, marginTop, gutter } = {
    verticalSpace: 25,
    marginTop: 25,
    gutter: 25
  };

  useEffect(() => {
    return trrack.currentChange(() => {
      setCurrentNode(trrack.current.id);
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
      currentNode={currentNode || trrack.root.id}
    />
  );
};

type TrrackVisWidgetProps = TrrackVisProps & {
  onButtonClick: () => void;
  resetTrrack: () => void;
};
export class TrrackVisWidget extends ReactWidget {
  constructor(private props: TrrackVisWidgetProps) {
    super();
  }

  render() {
    return (
      <>
        <div>
          <Button onClick={this.props.onButtonClick}>Add random msg</Button>
          <Button onClick={this.props.resetTrrack}>Reset</Button>
        </div>
        <TrrackVisComponent trrack={this.props.trrack} />
      </>
    );
  }
}

export function renderTrrackVisWidget(
  props: TrrackVisWidgetProps,
  node: HTMLElement
) {
  const widget = new TrrackVisWidget(props);

  widget.addClass(TRX_OUTPUT_AREA_TRRACK_CLASS);

  Widget.attach(widget, node);

  return widget;
}
