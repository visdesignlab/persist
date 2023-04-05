import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { RenderedVega } from '@jupyterlab/vega5-extension';
import { RenderedTrrackOutput } from '../../../renderers';

import { Result } from 'vega-embed';
import { Nullable } from '../../../types';

export class RenderedTrrackVegaOutput extends RenderedTrrackOutput {
  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
  }

  protected _createRenderer(
    opts: IRenderMime.IRendererOptions
  ): IRenderMime.IRenderer {
    return new RenderedVega(opts);
  }

  get vega(): Nullable<Result> {
    return (this._executeResultRenderer as any)?._result;
  }
}
