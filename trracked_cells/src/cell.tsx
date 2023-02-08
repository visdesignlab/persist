import { Cell, CodeCell } from '@jupyterlab/cells';
import { HTML2RendererFactory } from './rendered';

export class TrrackedCodeCell extends CodeCell {
  static isTrrackedCodeCell(cell: Cell): cell is TrrackedCodeCell {
    return cell instanceof TrrackedCodeCell;
  }

  // private _triageElement: HTMLElement;

  constructor(options: CodeCell.IOptions) {
    options.rendermime.addFactory(HTML2RendererFactory);

    console.log('Opts', options);
    super(options);

    // Assigns after footer
    // this._triageElement = document.createElement('div');
    // this._triageElement.innerHTML = 'Triage';
    // this.node.appendChild(this._triageElement);
  }
}
