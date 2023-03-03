import { ISessionContext } from '@jupyterlab/apputils';
import { IOutput } from '@jupyterlab/nbformat';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { Signal } from '@lumino/signaling';
import { IDEGlobal } from '../../utils';

export const PY_STR_TYPE = 'str';
export const PY_PD_TYPE = 'pandas.core.frame.DataFrame';

type WithOpts = {
  withIDE?: boolean;
  withPandas?: boolean;
  withJson?: boolean;
};

export class Executor {
  static init(nbTracker: INotebookTracker) {
    nbTracker.currentChanged.connect(async (_, nbPanel) => {
      if (!nbPanel) IDEGlobal.executor = null;
      else IDEGlobal.executor = new Executor(nbPanel);
    });
  }

  private _output: IOutput | null = null;
  private _relayOutput = new Signal<this, void>(this);
  private _future: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null = null;
  private _ctx: ISessionContext;

  private constructor(nbPanel: NotebookPanel) {
    this._ctx = nbPanel.sessionContext;
  }

  get hasFuture() {
    return Boolean(this._future);
  }

  get future() {
    if (!this._future) throw new Error('No future set');
    return this._future;
  }

  set future(
    val: Kernel.IFuture<
      KernelMessage.IExecuteRequestMsg,
      KernelMessage.IExecuteReplyMsg
    >
  ) {
    this._future = val;
    if (!val) {
      return;
    }

    val.onIOPub = this._onIOPub;
  }

  get output(): IOutput | null {
    return this._output;
  }

  execute(
    code: string,
    { withIDE = false, withPandas = false, withJson = false }: WithOpts = {}
  ) {
    if (withJson) {
      code = Private.withJson(code);
    }

    if (withPandas) {
      code = Private.withPandas(code);
    }

    if (withIDE) {
      code = Private.withIDE(code);
    }

    const kernel = this._ctx.session?.kernel;
    if (!kernel) {
      return;
    }

    this.future = kernel.requestExecute({
      code,
      stop_on_error: true,
      store_history: false
    });

    return this.future;
  }

  private _onIOPub = (msg: KernelMessage.IIOPubMessage) => {
    const msgType = msg.header.msg_type;

    switch (msgType) {
      case 'execute_result':
      case 'display_data':
      case 'update_display_data':
        this._output = msg.content as IOutput;
        this._relayOutput.emit();
        break;
      default:
        break;
    }
  };
}

export namespace Private {
  export function withIDE(code: string) {
    return `from interactivede.internal import *\n${code}`;
  }

  export function withJson(code: string) {
    return `import json\n${code}`;
  }

  export function withPandas(code: string) {
    return `import pandas as pd\n${code}`;
  }
}
