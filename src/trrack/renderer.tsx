import { PanelLayout, Widget } from '@lumino/widgets';
import { TrrackableCellId } from '../cells';
import { Nullable } from '../types';
import { TrrackVisWidget } from './widget';

export class RenderedTrrackGraph extends Widget {
  private _panelLayout: PanelLayout;
  private _id: Nullable<TrrackableCellId> = null;
  constructor() {
    super();
    this.layout = this._panelLayout = new PanelLayout();
  }

  render(id: TrrackableCellId): Promise<void> {
    if (id === this._id) return Promise.resolve();

    this._id = id;

    const widget = new TrrackVisWidget(id);

    this._panelLayout.addWidget(widget);

    return Promise.resolve();
  }
}
