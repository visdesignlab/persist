import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { RenderedVega } from '@jupyterlab/vega5-extension';
import { TrrackableCellId, VegaManager } from '../cells';
import { Nullable } from '../types';

export class RenderedVega2 extends RenderedVega {
  private _vegaManager: VegaManager | null = null;
  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
  }

  get vegaResult(): any {
    return (this as any)._result;
  }

  get view() {
    return this.vegaResult?.view;
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const superResult = await super.renderModel(model);

    const vega = this.vegaResult;
    const cellId = model.metadata['cellId'] as Nullable<TrrackableCellId>;

    if (cellId && vega) {
      this._vegaManager?.dispose();
      this._vegaManager = new VegaManager(cellId, vega);
    }

    return superResult;
  }

  dispose(): void {
    this._vegaManager?.dispose();
    super.dispose();
  }
}
