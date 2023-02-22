import { InputPrompt } from '@jupyterlab/cells';
import { circleIcon } from '@jupyterlab/ui-components';
import { Panel, PanelLayout, Widget } from '@lumino/widgets';

export const INPUT_PROMPT_CONTAINER = 'inputPrompt-prompt-container';
export const INPUT_PROMPT_STATUS = 'inputPrompt-prompt-status';

export const INPUT_PROMPT_DISPLAY_NONE = 'inputPrompt-prompt-displayNone';
export const INPUT_PROMPT_CONNECTED = 'inputPrompt-prompt-connected';
export const INPUT_PROMPT_DISCONNECTED = 'inputPrompt-prompt-disconnected';

export class TrrackedInputPrompt extends InputPrompt {
  private _executionCountWidget: Widget = new Widget({
    node: document.createElement('span')
  });
  private _connectionStatusWidget: Widget = new Widget({
    node: document.createElement('span')
  });

  constructor() {
    super();

    const promptContainer = new Panel();
    promptContainer.addClass(INPUT_PROMPT_CONTAINER);

    const panelLayout = new PanelLayout();
    panelLayout.addWidget(promptContainer);

    this.layout = panelLayout;

    promptContainer.addWidget(this._executionCountWidget);
    promptContainer.addWidget(this._connectionStatusWidget);

    circleIcon.element({
      container: this._connectionStatusWidget.node,
      height: '10px',
      width: '10px'
    });
    this._connectionStatusWidget.addClass(INPUT_PROMPT_STATUS);
    this._connectionStatusWidget.addClass(INPUT_PROMPT_DISPLAY_NONE);
  }

  private _nExecutionCount: string | null = null;
  get executionCount(): string | null {
    return this._nExecutionCount;
  }
  set executionCount(value: string | null) {
    this._nExecutionCount = value;
    if (value === null) this._executionCountWidget.node.textContent = ' ';
    else this._executionCountWidget.node.textContent = `[${value || ' '}]:`;
  }

  private _connectionStatus = false;
  get connectionStatus(): boolean {
    return this._connectionStatus;
  }
  set connectionStatus(value: boolean) {
    this._connectionStatus = value;
    this._connectionStatusWidget.toggleClass(
      INPUT_PROMPT_DISPLAY_NONE,
      this.connectionStatus
    );
  }
}
