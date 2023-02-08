import { IRenderMime, RenderedHTML } from '@jupyterlab/rendermime';

export interface IRenderedTextOptions {
  /**
   * The host node for the text content.
   */
  host: HTMLElement;
}

export function renderHtml2(options: IRenderedTextOptions): Promise<void> {
  const { host } = options;
  console.log(host.innerHTML);
  host.innerHTML += '<div>Hello World</div>';

  return Promise.resolve(undefined);
}

export class RenderedHTML2 extends RenderedHTML {
  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
  }

  async render(model: IRenderMime.IMimeModel): Promise<void> {
    console.log(model.trusted);
    console.log(model.data);
    return super.render(model).then(() =>
      renderHtml2({
        host: this.node
      })
    );
  }
}

export const HTML2RendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: ['text/html'],
  defaultRank: 40,
  createRenderer: options => new RenderedHTML2(options)
};
