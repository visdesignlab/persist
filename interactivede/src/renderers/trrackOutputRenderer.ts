import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { Panel, PanelLayout } from '@lumino/widgets';
import { TrrackableCellId } from '../cells';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../constants';
import { IDEGlobal } from '../utils';

const TRRACK_OUTPUT_AREA_OUTPUT_CLASS = 'trrack-OutputArea-output';
const TRRACK_OUTPUT_AREA_EXECUTE_RESULT_CLASS =
  'trrack-OutputArea-executeResult';
const TRRACK_OUTPUT_AREA_ORIGINAL_CLASS = 'jp-OutputArea-output';
const TRRACK_OUTPUT_AREA_TRRACK_CLASS = 'trrack-OutputArea-trrack';
const ENABLE_SCROLL = 'enable-scroll';

export class RenderedTrrackOutput extends RenderedCommon {
  private _regularOutputWidget: Panel;
  private _trrackOutputWidget: Panel;
  private _panelLayout: PanelLayout;

  constructor(_options: IRenderMime.IRendererOptions) {
    super(_options);
    this.addClass('lm-Panel');
    this.layout = this._panelLayout = new PanelLayout();
    this.addClass(TRRACK_OUTPUT_AREA_OUTPUT_CLASS);

    this._regularOutputWidget = new Panel();
    this._trrackOutputWidget = new Panel();
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    // Empty any existing content in the node from previous renders

    while (this._panelLayout.widgets.length > 0) {
      this._panelLayout.widgets[0].dispose();
      this._panelLayout.removeWidgetAt(0);
    }

    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }

    this._regularOutputWidget = new Panel();
    this._regularOutputWidget.addClass(TRRACK_OUTPUT_AREA_EXECUTE_RESULT_CLASS);
    this._regularOutputWidget.addClass(TRRACK_OUTPUT_AREA_ORIGINAL_CLASS);
    this._panelLayout.addWidget(this._regularOutputWidget);

    this._trrackOutputWidget = new Panel();
    this._trrackOutputWidget.addClass(TRRACK_OUTPUT_AREA_TRRACK_CLASS);
    this._panelLayout.addWidget(this._trrackOutputWidget);

    // Toggle the trusted class on the widget.
    this.toggleClass('jp-mod-trusted', model.trusted);

    // Render the actual content.
    await this.render(model);

    // Handle the fragment identifier if given.
    const { fragment } = model.metadata || {};
    if (fragment) {
      this.setFragment(fragment as string);
    }
  }

  async render(model: IRenderMime.IMimeModel): Promise<void> {
    const { renderMimeRegistry } = IDEGlobal;

    const dataTypes: ReadonlyPartialJSONObject | undefined = model.data[
      TRRACK_MIME_TYPE
    ] as ReadonlyPartialJSONObject;

    if (!dataTypes) return Promise.resolve();

    const { [TRRACK_GRAPH_MIME_TYPE]: _id, ...data } = dataTypes;

    const id = _id as TrrackableCellId;

    const renderPromises: Array<Promise<void>> = [];

    if (id) {
      const subModel: IRenderMime.IMimeModel = {
        ...model,
        metadata: model.metadata || {},
        data: { [TRRACK_GRAPH_MIME_TYPE]: id }
      };

      const renderer = renderMimeRegistry.createRenderer(
        TRRACK_GRAPH_MIME_TYPE
      );
      const trrackPromise = renderer.renderModel(subModel).then(() => {
        this._trrackOutputWidget.addWidget(renderer);
      });

      renderPromises.push(trrackPromise);
    }

    if (data) {
      const prefferedMimeType = renderMimeRegistry.preferredMimeType(data);
      if (!prefferedMimeType) return Promise.resolve();

      const { [prefferedMimeType]: _data } = data;

      if (!_data) return Promise.resolve();

      const subModel: IRenderMime.IMimeModel = {
        trusted: model.trusted,
        metadata: {
          ...(model.metadata || {}),
          cellId: id
        },
        data: {
          [prefferedMimeType]: _data as ReadonlyPartialJSONObject
        },
        setData(_options) {
          return;
        }
      };

      const renderer = renderMimeRegistry.createRenderer(prefferedMimeType);

      const dataRender = renderer.renderModel(subModel).then(() => {
        renderer.addClass(ENABLE_SCROLL);
        this._regularOutputWidget.node.innerHTML = '';
        this._regularOutputWidget.addWidget(renderer);
      });

      renderPromises.push(dataRender);
    }

    return Promise.all(renderPromises).then(() => {
      IDEGlobal.cells.get(id)?.addOutputWidget(this._panelLayout);
    });
  }
}
