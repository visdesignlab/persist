import { ExecutionCount } from '@jupyterlab/nbformat';
import { IOutputPrompt } from '@jupyterlab/outputarea';
import { Widget } from '@lumino/widgets';

const OUTPUT_PROMPT_CLASS = 'jp-OutputPrompt';

export class TrrackedOutputPrompt extends Widget implements IOutputPrompt {
  constructor() {
    super();

    this.addClass(OUTPUT_PROMPT_CLASS);
    this._codeExecutionDisplay = document.createElement('div');
    this._trrackExecutionDisplay = document.createElement('div');

    this.node.appendChild(this._codeExecutionDisplay);
    this.node.appendChild(this._trrackExecutionDisplay);
  }

  /**
   * The execution count for the prompt.
   */
  get executionCount(): ExecutionCount {
    return this._executionCount;
  }
  set executionCount(value: ExecutionCount) {
    this._executionCount = value;
    if (value === null) {
      this._codeExecutionDisplay.textContent = '';
    } else {
      this._codeExecutionDisplay.textContent = `[${value}]:`;
    }
  }

  get trrackExecutionCount(): ExecutionCount {
    return this._trrackExecutionCount;
  }

  set trrackExecutionCount(value: ExecutionCount) {
    this._trrackExecutionCount = value;
    if (value === null) {
      this._trrackExecutionDisplay.textContent = '';
    } else {
      this._trrackExecutionDisplay.textContent = `[${value}]:`;
    }
  }

  private _executionCount: ExecutionCount = null;
  private _trrackExecutionCount: ExecutionCount = null;
  private _codeExecutionDisplay: HTMLDivElement;
  private _trrackExecutionDisplay: HTMLDivElement;
}
