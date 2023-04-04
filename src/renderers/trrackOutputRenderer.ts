import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { ReadonlyPartialJSONObject, UUID } from '@lumino/coreutils';
import { Panel, PanelLayout } from '@lumino/widgets';
import { OutputHeaderWidget, TrrackableCellId } from '../cells';
import { TRRACK_GRAPH_MIME_TYPE, TRRACK_MIME_TYPE } from '../constants';
import { IDEGlobal } from '../utils';

const OUTPUT_AREA_CLASS = 'jp-trrack-OutputArea-output';
const EXECUTE_RESULT_CLASS = 'jp-trrack-OutputArea-executeResult';
const OUTPUT_AREA_ORIGINAL_CLASS = 'jp-OutputArea-output'; // The original class from JupyterLab
const TRRACK_VIS_CLASS = 'jp-trrack-OutputArea-trrack';
const ENABLE_SCROLL = 'enable-scroll';

const TRRACK_SECTION_ID = 'trrack';
const REGULAR_SECTION_ID = 'regular';

export class RenderedTrrackOutput extends RenderedCommon {
  private _outputHeaderWidget = new OutputHeaderWidget(); // Output header widget
  private _executeResultWidget = new Panel(); // Execute result widget
  private _trrackVisWidget = new Panel(); // TrrackVisWidget

  private _panelLayout: PanelLayout;

  private _trrackCurrentId = '';
  private _currentRenderedData = '';

  constructor(_options: IRenderMime.IRendererOptions) {
    super(_options);
    this.layout = this._panelLayout = new PanelLayout();
    this.addClass('lm-Panel');

    this.addClass(OUTPUT_AREA_CLASS);

    // Setup outputArea widget
    // nothing

    // Setup execute result widget
    this._executeResultWidget.id = REGULAR_SECTION_ID;
    this._executeResultWidget.addClass(EXECUTE_RESULT_CLASS);
    this._executeResultWidget.addClass(OUTPUT_AREA_ORIGINAL_CLASS);

    // Setup trrack widget
    this._trrackVisWidget.id = TRRACK_SECTION_ID;
    this._trrackVisWidget.addClass(TRRACK_VIS_CLASS);

    this._panelLayout.addWidget(this._outputHeaderWidget);
    this._panelLayout.addWidget(this._executeResultWidget);
    this._panelLayout.addWidget(this._trrackVisWidget);
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
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
      const cell = IDEGlobal.cells.get(id);

      const trrackManager = cell?.trrackManager;

      if (this._trrackCurrentId !== trrackManager?.current) {
        this._trrackCurrentId = trrackManager?.current || '';

        while (this._trrackVisWidget.widgets.length > 0) {
          (this._trrackVisWidget.layout as PanelLayout)?.widgets[0].dispose();
          (this._trrackVisWidget.layout as PanelLayout)?.removeWidgetAt(0);
        }

        const subModel: IRenderMime.IMimeModel = {
          ...model,
          metadata: model.metadata || {},
          data: { [TRRACK_GRAPH_MIME_TYPE]: id }
        };

        const renderer = renderMimeRegistry.createRenderer(
          TRRACK_GRAPH_MIME_TYPE
        );
        const trrackPromise = renderer.renderModel(subModel).then(() => {
          this._trrackVisWidget.addWidget(renderer);
        });

        renderPromises.push(trrackPromise);
      }
    }

    if (data) {
      if (this._currentRenderedData !== JSON.stringify(data)) {
        this._currentRenderedData = JSON.stringify(data);

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
        renderer.id = UUID.uuid4();

        const dataRender = renderer.renderModel(subModel).then(() => {
          renderer.addClass(ENABLE_SCROLL);
          this._executeResultWidget.addWidget(renderer);
          this._executeResultWidget.widgets.forEach(w => {
            if (w.id !== renderer.id) {
              this._executeResultWidget.layout?.removeWidget(w);
            }
          });
        });

        renderPromises.push(dataRender);
      }
    }

    return Promise.all(renderPromises).then(() => {
      IDEGlobal.cells
        .get(id)
        ?.updateOutputHeaderWidget(this._outputHeaderWidget);
    });
  }
}
