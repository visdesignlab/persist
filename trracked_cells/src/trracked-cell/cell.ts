import { Cell, CodeCell } from '@jupyterlab/cells';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Panel } from '@lumino/widgets';
import { CellCommManager } from '../kernel';
import { RenderedHTML2, TRX_VIS_CONTAINER } from '../misc/rendered';
import { TrrackManager } from '../trrack/trrack-manager';
import { renderTrrackVisWidget, TrrackVisWidget } from '../trrack/trrack-vis';
import { TrrackedCellManager } from './cell-manager';

export function isTrrackedCodeCell(cell: Cell): cell is TrrackedCodeCell {
  return cell instanceof TrrackedCodeCell;
}

export class TrrackedCodeCell extends CodeCell {
  constructor(options: CodeCell.IOptions) {
    super(options);
    this.manager = new TrrackedCellManager(this);

    this._cManager = new CellCommManager(this.model.id);

    if (this.model.outputs.length > 0) {
      this.manager.trrackManager.init();

      this.manager.trrackManager.trrackChange.connect(() => {
        this._setupTrrackListeners();
        this.attemptToRenderTrrack();
      });

      this._setupTrrackListeners();
      this._saveTrrackToModel(this.manager.trrackManager);
      this._setupAndDestroyRenderSignalListener();
    }

    this.model.outputs.changed.connect((a, _) => {
      if (this._trrackVis) return;
      if (this.manager.trrackManager.trrack) return;
      if (a.length > 0) this.manager.trrackManager.init();
    });
    console.log('Called');
  }

  // Private
  manager: TrrackedCellManager;
  _cManager: CellCommManager;
  // private counter = 0;

  // private _trrackInstance: TrrackManager;

  private _trrackVis: TrrackVisWidget | null = null;

  private _renderer: RenderedHTML2 | null = null;

  private _setupAndDestroyRenderSignalListener() {
    if (this._hasValidOutput()) {
      const panel = this.outputArea.layout.widgets;

      const outputResultWidget = panel.find(w =>
        w.hasClass('jp-OutputArea-executeResult')
      ) as Panel | undefined;

      if (outputResultWidget) {
        const rendererWidget = outputResultWidget
          .widgets[1] as IRenderMime.IRenderer;

        if (rendererWidget instanceof RenderedHTML2) {
          this._renderer = rendererWidget;
          rendererWidget.renderComplete.connect(
            this._renderSignalHandler,
            this
          );
        }
      }
    }
  }

  private _renderSignalHandler() {
    this.attemptToRenderTrrack();
    this._renderer?.renderComplete.disconnect(this._renderSignalHandler, this);
  }

  private _setupTrrackListeners() {
    if (
      !this.manager.trrackManager.currentChanged.connect(
        this._saveTrrackToModel,
        this
      )
    ) {
      throw new Error('Could not connect to currentChanged signal');
    }
  }

  private _saveTrrackToModel(trrack: TrrackManager) {
    this.model.metadata.set('trrack', trrack.serialize());
  }

  private _reset() {
    this.manager.trrackManager.currentChanged.disconnect(
      this._saveTrrackToModel,
      this
    );

    this.model.metadata.delete('trrack');

    this.manager.trrackManager.dispose();
    this.manager.trrackManager.init();

    this.manager.trrackManager.currentChanged.connect(
      this._saveTrrackToModel,
      this
    );

    this.attemptToRenderTrrack();
  }

  private _hasValidOutput(): boolean {
    const outputs = this.model.outputs.toJSON();

    const result = outputs.filter(r => r.output_type === 'execute_result');

    if (result.length > 1) {
      throw new Error('More than one execute_result in a cell found! Handle!');
    }

    return result.length === 1;
  }

  private _shouldRenderTrrack() {
    return this._hasValidOutput();
  }

  private counter = 0;

  attemptToRenderTrrack() {
    const trrack = this.manager.trrackManager.trrack;
    if (!trrack) return;
    if (!this._shouldRenderTrrack()) return;

    this._trrackVis = null;

    const rootNode = this.outputArea.node;

    let nodes: any = rootNode.getElementsByClassName(TRX_VIS_CONTAINER);

    if (nodes.length === 0) {
      const _n = rootNode.getElementsByClassName('jp-OutputArea-output')[0];

      const div = document.createElement('div');
      div.classList.add(TRX_VIS_CONTAINER);

      _n.append(div);

      nodes = [_n];
    }

    if (nodes.length > 1) {
      console.table(nodes);
      throw new Error(
        `Only one node with class name ${TRX_VIS_CONTAINER} expected. Found: ${nodes.length}`
      );
    }

    const _node = nodes[0];

    _node.innerHTML = '';

    if (!(_node instanceof HTMLElement)) {
      throw new Error('node is not a valid HTMLElement');
    }

    this._trrackVis = renderTrrackVisWidget(
      {
        trrack,
        onButtonClick: () => {
          trrack.apply(
            `Update ${++this.counter}`,
            this.manager.trrackManager.actions.testAction('Hello')
          );
        },
        resetTrrack: this._reset.bind(this)
      },
      _node
    );
  }

  // Accessors
  get trrackVis() {
    return this._trrackVis;
  }

  // Method
}
