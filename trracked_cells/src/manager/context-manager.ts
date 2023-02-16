import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { JSONObject, JSONValue } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';

export const TRX_EXTENSION_COMM = 'trx-extension-comm';
export const TRX_EXTENSION_COMM2 = 'trx-extension-comm2';

export declare interface ICommProxy {
  open(
    data?: JSONValue,
    metadata?: JSONObject,
    buffers?: (ArrayBuffer | ArrayBufferView)[]
  ): void;
  send(
    data: JSONValue,
    metadata?: JSONObject,
    buffers?: (ArrayBuffer | ArrayBufferView)[],
    disposeOnDone?: boolean
  ): void;
  onMsg: (msg: KernelMessage.ICommMsgMsg) => void;
}

export declare interface IKernelProxy {
  // copied from https://github.com/jupyterlab/jupyterlab/blob/master/packages/services/src/kernel/default.ts#L605
  registerCommTarget(
    targetName: string,
    callback: (comm: Kernel.IComm, msg: KernelMessage.ICommOpenMsg) => void
  ): void;
  connectToComm(targetName: string, commId?: string): ICommProxy;
}

export class ContextManager implements IDisposable {
  private _context: DocumentRegistry.IContext<DocumentRegistry.IModel> | null;
  private _comm: Kernel.IComm | null;

  constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
    this._context = context;
    this._comm = null;

    context.sessionContext.statusChanged.connect((_, connectionStatus) => {
      if (connectionStatus === 'restarting' || connectionStatus === 'starting')
        this._comm = null;
    }, this);
  }

  init() {
    const registerClosure = (
      targetName: string,
      callback: (comm: Kernel.IComm, msg: KernelMessage.ICommOpenMsg) => void
    ): void => {
      if (!this._context?.sessionContext) {
        return;
      }
      const kernel = this._context.sessionContext.session?.kernel;

      if (!kernel) return;

      if (kernel === undefined) {
        console.log(
          'Kernel not found, could not register comm target ',
          targetName
        );
        return;
      }
      return kernel.registerCommTarget(targetName, callback);
    };

    const connectClosure = (targetName: string, commId?: string): any => {
      const proxy = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        open: function (): void {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        send: function (): void {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onMsg: function (): void {}
      };

      if (!this._context?.sessionContext) {
        return proxy;
      }
      const kernel = this._context.sessionContext.session?.kernel;

      if (!kernel) {
        console.log(
          'Kernel not found, could not connect to comm target ',
          targetName
        );
        return proxy;
      }

      const comm: Kernel.IComm = kernel.createComm(targetName, commId);
      const sendClosure = (
        data: JSONValue,
        metadata?: JSONObject,
        buffers?: (ArrayBuffer | ArrayBufferView)[],
        disposeOnDone?: boolean
      ): void => {
        if (!comm.isDisposed) {
          comm.send(data, metadata, buffers, disposeOnDone);
        }
      };
      const openClosure = (
        data?: JSONValue,
        metadata?: JSONObject,
        buffers?: (ArrayBuffer | ArrayBufferView)[]
      ): void => {
        comm.open(data, metadata, buffers);
      };
      const comm_proxy: ICommProxy = {
        set onMsg(callback: (msg: KernelMessage.ICommMsgMsg) => void) {
          comm.onMsg = callback;
        },
        open: openClosure,
        send: sendClosure
      };
      return comm_proxy;
    };
    return {
      connectToComm: connectClosure,
      registerCommTarget: registerClosure
    } as IKernelProxy;
  }

  get context() {
    return this._context;
  }

  get comm() {
    if (!this._context?.sessionContext) {
      return null;
    }

    const kernel = this._context.sessionContext.session?.kernel;

    if (this._comm === null && kernel !== null && kernel !== undefined) {
      this._comm = kernel.createComm(TRX_EXTENSION_COMM);

      if (this._comm !== null) {
        this._comm.open();
      }
    }

    return this._comm;
  }

  get isDisposed() {
    return this._context === null;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this._context = null;
    this._comm = null;
  }
}
