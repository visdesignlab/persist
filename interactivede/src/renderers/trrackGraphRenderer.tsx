import { ReactWidget } from '@jupyterlab/apputils';
import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { PanelLayout } from '@lumino/widgets';
import React from 'react';
import { ITrrackManager } from '../cells/trrack/trrackManager';
import { TrrackableCellId } from '../cells/trrackableCell';
import { TrrackVisComponent } from '../cells/TrrackVisComponent';
import { TRRACK_GRAPH_MIME_TYPE } from '../constants';
import { IDEGlobal } from '../utils/IDEGlobal';

const TRRACK_VIS_HIDE_CLASS = 'jp-TrrackVisWidget-hide';

class TrrackVisWidget extends ReactWidget {
  private _tManager: ITrrackManager;
  private _hasVegaPlot: boolean;

  constructor(id: TrrackableCellId) {
    super();
    const _tManager = IDEGlobal.trracks.get(id);
    if (!_tManager) throw new Error('TrrackManager not found');
    this._tManager = _tManager;

    this._hasVegaPlot = Boolean(IDEGlobal.views.get(id));
    this.toggle(this._hasVegaPlot);
  }

  toggle(to: boolean) {
    this.toggleClass(TRRACK_VIS_HIDE_CLASS, !to);
  }

  render() {
    return <TrrackVisComponent manager={this._tManager} />;
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
