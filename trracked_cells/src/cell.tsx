import { Cell, CodeCell } from '@jupyterlab/cells';
import { Message } from '@lumino/messaging';
import { TRX_VIS_CONTAINER } from './rendered';
import { Trrack } from './trrack/setup';
import { renderTrrackVisWidget, TrrackVisWidget } from './trrack/vis';

export function isTrrackedCodeCell(cell: Cell): cell is TrrackedCodeCell {
  return cell instanceof TrrackedCodeCell;
}

export class TrrackedCodeCell extends CodeCell {
  constructor(options: CodeCell.IOptions) {
    super(options);

    this._trrackInstance = new Trrack(this);

    this._trrackInstance.trrackChange.connect(() => {
      this._setupTrrackListeners();
      this.attemptToRenderTrrack();
    });

    this._setupTrrackListeners();
    this._saveTrrackToModel(this.trrackInstance);

    this.outputArea.outputLengthChanged.connect((a, b) => {
      console.log('Outout Length', { a, b });
    });
  }

  protected onAfterAttach(msg: Message): void {
    console.log(msg);
    const panel = this.outputArea.layout.widgets;
    console.group('Output Area Widgets');
    panel.forEach(p => {
      console.log(p.node);
    });
    console.groupEnd();
  }

  // Private
  private counter = 0;

  private _trrackInstance: Trrack;

  private _trrackVis: TrrackVisWidget | null = null;

  private _setupTrrackListeners() {
    if (
      !this.trrackInstance.currentChanged.connect(this._saveTrrackToModel, this)
    ) {
      throw new Error('Could not connect to currentChanged signal');
    }
  }

  private _saveTrrackToModel(trrack: Trrack) {
    console.log('Update');
    this.model.metadata.set('trrack', trrack.serialize());
  }

  private _reset() {
    this.trrackInstance.currentChanged.disconnect(
      this._saveTrrackToModel,
      this
    );

    this.trrackInstance.reset();

    this.trrackInstance.currentChanged.connect(this._saveTrrackToModel, this);

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

  attemptToRenderTrrack(node?: HTMLElement) {
    if (!this._shouldRenderTrrack()) {
      return;
    }

    this._trrackVis = null;
    console.count('Trrack Render');

    const rootNode = node ? node : this.outputArea.node;

    const nodes = rootNode.getElementsByClassName(TRX_VIS_CONTAINER);

    if (nodes.length !== 1) {
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
        trrack: this.trrackInstance.trrack,
        onButtonClick: () => {
          this.trrackInstance.trrack.apply(
            `Update ${++this.counter}`,
            this.trrackInstance.actions.testAction('Hello')
          );
        },
        resetTrrack: this._reset.bind(this)
      },
      _node
    );
  }

  // Accessors
  get trrackInstance() {
    return this._trrackInstance;
  }

  get trrackVis() {
    return this._trrackVis;
  }

  // Method
}
