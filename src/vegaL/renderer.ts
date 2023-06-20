import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { RenderedVega } from '@jupyterlab/vega5-extension';
import { Result } from 'vega-embed';
import { TrrackableCell } from '../cells';
import { RenderedTrrackOutput } from '../cells/output/renderer';
import { IDEGlobal, Nullable } from '../utils';
import { VegaManager } from './manager';
import { Spec } from './spec';

export type Vega = Result;

// const POS_ABS = 'pos-abs';
// const POS_REL = 'pos-rel';

export class RenderedTrrackVegaOutput extends RenderedTrrackOutput {
  _id = Math.random();

  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
  }

  protected createRenderer(
    opts: IRenderMime.IRendererOptions
  ): IRenderMime.IRenderer {
    return new RenderedVega(opts);
  }

  dispose() {
    super.dispose();
    if (this._unsafeVegaAccess) {
      this._vega.view.finalize();
    }
  }

  protected postRender(cell: TrrackableCell): Promise<void> {
    const vm = VegaManager.create(cell, this._vega);
    cell.addSpecToMetadata(this.spec);
    if (IDEGlobal.cellUpdateStatus.get(cell) === 'execute') {
      vm.update();
    }

    return Promise.resolve();
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const renderResult = await super.renderModel(model);

    return renderResult;
  }

  /**
   * Do not access except to for conditional checks
   */
  private get _unsafeVegaAccess(): boolean {
    return Boolean(
      (this.executeResultRenderer as any)?._result as Nullable<Vega>
    );
  }

  private get _vega(): Vega {
    if (!this._unsafeVegaAccess) {
      throw new Error(
        'Vega object not yet created! Should only be accessed by vega manager created from postRender.'
      );
    }

    return (this.executeResultRenderer as any)?._result as Vega;
  }

  private get spec(): Spec {
    return this._vega.spec as Spec;
  }
}
