import { IRenderMime, RenderedCommon } from '@jupyterlab/rendermime';
import { Panel, PanelLayout } from '@lumino/widgets';
import { OutputHeaderWidget } from '../cells';
import { Nullable } from '../types';
import { IDEGlobal } from '../utils';
import { RenderedTrrackGraph } from './trrackGraphRenderer';

const OUTPUT_AREA_CLASS = 'jp-trrack-OutputArea-output';
const EXECUTE_RESULT_CLASS = 'jp-trrack-OutputArea-executeResult';
const OUTPUT_AREA_ORIGINAL_CLASS = 'jp-OutputArea-output'; // The original class from JupyterLab
const TRRACK_VIS_CLASS = 'jp-trrack-OutputArea-trrack';

const GRID_AREA_HEAD = 'jp-gridArea-OutputArea-head';
const GRID_AREA_OUTPUT = 'jp-gridArea-OutputArea-output';
const GRID_AREA_TRRACK = 'jp-gridArea-OutputArea-trrack';
const ENABLE_SCROLL = 'enable-scroll';

const TRRACK_SECTION_ID = 'trrack';
const REGULAR_SECTION_ID = 'regular';

export abstract class RenderedTrrackOutput extends RenderedCommon {
  private _outputHeaderWidget = new OutputHeaderWidget(); // Output header widget
  // private _executeResultWidget = new Panel(); // Execute result widget // def
  protected _executeResultRenderer: IRenderMime.IRenderer;
  private _trrackVisWidget = new Panel(); // TrrackVisWidget
  private _trrackVisRenderer: Nullable<RenderedTrrackGraph> = null;

  private _panelLayout: PanelLayout;

  constructor(_options: IRenderMime.IRendererOptions) {
    super(_options);

    this.layout = this._panelLayout = new PanelLayout();
    this.addClass('lm-Panel');

    this.addClass(OUTPUT_AREA_CLASS);

    // Setup outputArea widget
    this._setupOutputHeaderWidget();

    // Setup execute result widget
    this._executeResultRenderer = this._createRenderer(_options);
    this._setupExecuteResultWidget();

    // Setup trrack widget
    this._setupTrrackWidget();

    // Add all widgets to output layout
    this._panelLayout.addWidget(this._outputHeaderWidget);
    this._panelLayout.addWidget(this._executeResultRenderer);
    this._panelLayout.addWidget(this._trrackVisWidget);
  }

  protected abstract _createRenderer(
    opts: IRenderMime.IRendererOptions
  ): IRenderMime.IRenderer;

  _setupOutputHeaderWidget() {
    this._outputHeaderWidget.addClass(GRID_AREA_HEAD); // add grid-area name
  }

  _setupTrrackWidget() {
    this._trrackVisWidget.id = TRRACK_SECTION_ID;
    this._trrackVisWidget.addClass(GRID_AREA_TRRACK); // add grid-area name
    this._trrackVisWidget.addClass(TRRACK_VIS_CLASS);
    if (!this._trrackVisRenderer)
      this._trrackVisRenderer = new RenderedTrrackGraph();

    this._trrackVisWidget.addWidget(this._trrackVisRenderer);
  }

  _setupExecuteResultWidget() {
    this._executeResultRenderer.id = REGULAR_SECTION_ID;
    this._executeResultRenderer.addClass(GRID_AREA_OUTPUT); // add grid-area name
    this._executeResultRenderer.addClass(EXECUTE_RESULT_CLASS);
    this._executeResultRenderer.addClass(OUTPUT_AREA_ORIGINAL_CLASS);
    this._executeResultRenderer.addClass(ENABLE_SCROLL);
  }

  /**
   * This is the default class
   */
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    this.toggleClass('jp-mod-trusted', model.trusted); // add trusted class

    // Render the content.
    await this.render(model);

    // Handle the fragment identifier if given. Not sure what this does, but it
    // is done in most implementations of RenderedCommon
    const { fragment } = model.metadata || {};
    if (fragment) {
      this.setFragment(fragment as string);
    }
  }

  /**
   * New render logic for output area
   */
  async render(model: IRenderMime.IMimeModel): Promise<void> {
    // Get the id of the cell from metadata

    const originalRender = await this._executeResultRenderer.renderModel(model);

    const id = model.metadata?.cellId as Nullable<string>;

    if (!id) {
      console.warn(
        'Cell id not found in metadata for following element. Consider not using RenderedTrrackOutput'
      );
      console.warn(this.node);
    }

    // Retrieve cell from global cells map. Disabling assertion because its tested later
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cell = IDEGlobal.cells.get(id!);

    if (!id || !cell || !this._trrackVisRenderer) {
      this._outputHeaderWidget.hide();
      this._trrackVisRenderer?.hide();
    } else {
      this._outputHeaderWidget.show();
      this._trrackVisRenderer.show();
      this._outputHeaderWidget.associateCell(cell);
      this._trrackVisRenderer.render(id);
    }

    return originalRender;
  }
}
