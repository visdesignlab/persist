import { IRenderMime, RenderedHTML } from '@jupyterlab/rendermime';
import { ISignal, Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

const TRX_OUTPUT_AREA_LAYOUT_CLASS = 'trx-OutputArea-layout';
export const TRX_VIS_CONTAINER = 'trx-OutputArea-container';

export interface IRenderHTML2Options {
  /**
   * The host node for the text content.
   */
  host: HTMLElement;
}

export function renderHtml2(options: IRenderHTML2Options): Promise<void> {
  const { host } = options;

  const div = new Widget({
    node: document.createElement('div')
  });

  div.addClass(TRX_VIS_CONTAINER);

  Widget.attach(div, host);

  return Promise.resolve(undefined);
}

export class RenderedHTML2 extends RenderedHTML {
  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
    this.addClass(TRX_OUTPUT_AREA_LAYOUT_CLASS);
  }

  private _renderCompleteSignal = new Signal<any, this>(this);

  get renderComplete(): ISignal<any, this> {
    return this._renderCompleteSignal;
  }

  async render(model: IRenderMime.IMimeModel): Promise<void> {
    await super
      .render(model)
      .then(() =>
        renderHtml2({
          host: this.node
        })
      )
      .then(() => {
        this._renderCompleteSignal.emit(this);
      });

    return Promise.resolve(undefined);
  }
}

export const HTML2RendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: ['text/html'],
  defaultRank: 50,
  createRenderer: options => new RenderedHTML2(options)
};
