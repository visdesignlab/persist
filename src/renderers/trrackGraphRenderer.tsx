import { ReactWidget } from '@jupyterlab/apputils';
import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { PanelLayout } from '@lumino/widgets';
import React from 'react';
import { TrrackVisComponent, TrrackableCell, TrrackableCellId } from '../cells';
import { TRRACK_GRAPH_MIME_TYPE } from '../constants';
import { IDEGlobal } from '../utils';

const TRRACK_VIS_HIDE_CLASS = 'jp-TrrackVisWidget-hide';

class TrrackVisWidget extends ReactWidget {
  private _hasVegaPlot: boolean;
  private _cell: TrrackableCell;

  constructor(id: TrrackableCellId) {
    super();
    const cell = IDEGlobal.cells.get(id);
    if (!cell) throw new Error('Cell not found');
    this._cell = cell;

    this._hasVegaPlot = Boolean(cell.vegaManager.hasVega);
    this.toggle(this._hasVegaPlot);
  }

  toggle(to: boolean) {
    this.toggleClass(TRRACK_VIS_HIDE_CLASS, !to);
  }

  render() {
    return <TrrackVisComponent cell={this._cell} />;
  }
}

export class RenderedTrrackGraph extends RenderedCommon {
  private _panelLayout: PanelLayout;
  constructor(_options: IRenderMime.IRendererOptions) {
    super(_options);
    this.layout = this._panelLayout = new PanelLayout();
  }

  render(model: IRenderMime.IMimeModel): Promise<void> {
    const id = model.data[TRRACK_GRAPH_MIME_TYPE] as TrrackableCellId;

    const widget = new TrrackVisWidget(id);

    this._panelLayout.addWidget(widget);

    return Promise.resolve();
  }
}
