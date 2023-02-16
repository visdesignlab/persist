import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { JSONObject, JSONValue } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { ContextManager } from '../manager';

const HTML_MIME_TYPE = 'text/html';
export const TRRACK_MIME_TYPE = 'application/vnd.trrack+json';

export declare interface IWidgetManagerProxy {
  create_view(model: any, options?: any): any;
  set_state(state: any): Promise<any[]>;
}

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

export class RenderedTrrackVis extends Widget implements IRenderMime.IRenderer {
  // for classic nb compat reasons, the payload in contained in these mime messages
  private _html_mimetype: string = HTML_MIME_TYPE;
  // the metadata is stored here
  private _dispose: boolean;
  private _trrack_mimetype: string = TRRACK_MIME_TYPE;
  private _div_element: HTMLDivElement = document.createElement('div');
  private _manager: ContextManager | null = null;
  private _displayed: boolean;

  constructor(options: IRenderMime.IRendererOptions, manager: ContextManager) {
    super();
    this._createNodes();
    this._manager = manager;
    this._displayed = false;
    this._dispose = true;
  }

  _createNodes() {
    this._div_element = document.createElement('div');
  }

  _registerKernel(id: string) {
    const manager = this._manager;

    if (!manager) return;

    const wManager = manager.wManager;

    if (!wManager) return;

    const set_state = (state: any): Promise<any[]> => {
      return wManager.set_state(state);
    };

    const create_view = (model: any, options?: any): any => {
      return wManager.create_view(model, options);
    };

    const widget_manager: IWidgetManagerProxy = { create_view, set_state };
    (window as any).TrrackExt.widget_manager = widget_manager;

    const kernel = manager.context?.sessionContext.session?.kernel;

    const registerClosure = (
      targetName: string,
      callback: (comm: Kernel.IComm, msg: KernelMessage.ICommOpenMsg) => void
    ): void => {
      if (!kernel) {
        console.log(
          'Kernel not found, could not register comm target ',
          targetName
        );
        return;
      }
      return kernel.registerCommTarget(targetName, callback);
    };

    const connectClosure = (targetName: string, commId?: string): any => {
      if (!kernel) {
        console.log(
          'Kernel not found, could not connect to comm target ',
          targetName
        );
        return {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          open: function (): void {},
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          send: function (): void {},
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onMsg: function (): void {}
        };
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

    const kernel_proxy: IKernelProxy = {
      connectToComm: connectClosure,
      registerCommTarget: registerClosure
    };
    (window as any).TrrackExt.kernels[id] = kernel_proxy;

    manager.context?.sessionContext.statusChanged.connect(
      (session: any, status: string) => {
        if (status === 'restarting' || status === 'dead') {
          delete (window as any).TrrackExt.kernels[id];
          this._dispose = false;
        }
      },
      this
    );
  }

  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const metadata = model.metadata[this._trrack_mimetype] as JSONObject;

    const id = metadata.id as string;

    if (this._displayed) {
      this._disposePlot();
      this.node.removeChild(this._div_element);
      this._createNodes();
    }

    this._dispose = true;

    if (id) {
      if ((window as any).TrrackExt === undefined) {
        (window as any).TrrackExt = {
          comms: {},
          comm_status: {},
          kernels: {},
          receivers: {},
          plot_index: []
        };
      } else if ((window as any).TrrackExt.plot_index === undefined) {
        (window as any).TrrackExt.plot_index = [];
      }

      const html_data = model.data[this._html_mimetype] as string;
      this._div_element.innerHTML = html_data;
    }

    return Promise.resolve();
  }

  _disposePlot(): void {
    if (this._dispose) console.log('disposing plot');
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    this._disposePlot();
    this._manager = null;
  }
}
