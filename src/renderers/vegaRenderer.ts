import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { RenderedVega, VEGALITE4_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { JSONValue } from '@lumino/coreutils';

import { Panel, PanelLayout } from '@lumino/widgets';
import { Result } from 'vega-embed';
import { TrrackableCellId } from '../cells';
import { Nullable } from '../types';
import { IDEGlobal } from '../utils';

export const VEGALITE_MIMETYPE = VEGALITE4_MIME_TYPE;

export class RenderedVega2 extends RenderedCommon {
  static previousRenderedVega: RenderedVega | null = null;

  private opts: IRenderMime.IRendererOptions;
  private renderedVega: RenderedVega | null = null;

  panelLayout = new PanelLayout();
  widgetA: Panel = new Panel();
  widgetB: Panel = new Panel();
  currentVisible: 'A' | 'B' = 'A';

  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
    this.opts = options;
    this.addClass('vega-parent');

    this.widgetA.addClass('vega-child');
    this.widgetB.addClass('vega-child');

    this.panelLayout.addWidget(this.widgetA);
    this.panelLayout.addWidget(this.widgetB);

    this.currentVisible === 'A' ? this.widgetB.hide() : this.widgetA.hide();

    this.layout = this.panelLayout;
  }

  get vega(): Nullable<Result> {
    return (this.renderedVega as any)?._result;
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    await this.render(model);
  }

  async render(model: IRenderMime.IMimeModel): Promise<void> {
    const cellId = model.metadata['cellId'] as Nullable<TrrackableCellId>;
    if (!cellId) throw new Error('No cellId found');
    const cell = IDEGlobal.cells.get(cellId);
    if (!cell) throw new Error('No cell found');

    cell.vegaManager.renderer = this;
    this.renderedVega = new RenderedVega(this.opts);

    await this.renderedVega.renderModel(model);

    if (this.currentVisible === 'A') {
      while (this.widgetB.widgets.length > 0) {
        (this.widgetB.layout as PanelLayout).widgets[0].dispose();
        (this.widgetB.layout as PanelLayout).removeWidgetAt(0);
      }
      this.widgetB.node.textContent = '';
      this.widgetB.addWidget(this.renderedVega);
      this.widgetB.show();
      this.widgetA.hide();
      this.currentVisible = 'B';
    } else {
      while (this.widgetB.widgets.length > 0) {
        (this.widgetB.layout as PanelLayout).widgets[0].dispose();
        (this.widgetB.layout as PanelLayout).removeWidgetAt(0);
      }
      this.widgetA.node.textContent = '';
      this.widgetA.addWidget(this.renderedVega);
      this.widgetA.show();
      this.widgetB.hide();
      this.currentVisible = 'A';
    }

    if (RenderedVega2.previousRenderedVega) {
      RenderedVega2.previousRenderedVega.dispose();
    }
    RenderedVega2.previousRenderedVega = this.renderedVega;

    cell.vegaManager.addListeners();

    return Promise.resolve();
  }

  dispose(): void {
    super.dispose();
  }
}

export function getSpecFromModel(model: IRenderMime.IMimeModel) {
  const mimeType = Object.keys(model?.data || {}).find(
    m => m.includes('vegalite') && m.includes('v4')
  );
  if (!mimeType) throw new Error('No vegalite4 spec');

  const spec = model?.data[mimeType];

  if (!spec) throw new Error('No vegalite4 spec');

  return spec as JSONValue;
}
