import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { JSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import {
  TRRACK_GRAPH_MIME_TYPE,
  TRRACK_MIME_TYPE
} from '../renderers/mimetypes';
import { TrrackManager } from '../trrack/manager';
import { DisposableSignal } from '../utils/disposableSignals';
import {
  INPUT_PROMPT_CONNECTED,
  INPUT_PROMPT_DISCONNECTED,
  INPUT_PROMPT_DISPLAY_NONE,
  INPUT_PROMPT_STATUS
} from './trrackedInputPrompt';

type DisposeFunction = () => void;

type SignalType = 'OutputChange' | 'TrrackInstanceChange';

type SignalMap = { [key in SignalType]: DisposeFunction[] };

const signalInit: SignalMap = {
  OutputChange: [],
  TrrackInstanceChange: []
};

type MessageReason = 'ack' | 'interaction' | 'reset' | 'kernel';

type MsgData = JSONObject & {
  reason: MessageReason;
};

const getData = (msg: KernelMessage.ICommMsgMsg) => {
  const data = msg.content.data;

  const reason = data['reason'];

  if (!reason) {
    throw new Error(
      `msg data is not a Trrack message: ${JSON.stringify(data, null, 2)}`
    );
  }

  return data as MsgData;
};

export class TrrackedCell extends CodeCell implements IDisposable {
  constructor(_opts: CodeCell.IOptions) {
    super(_opts);

    this._trrackManager = new TrrackManager(this);

    this.model.outputs.fromJSON(this.model.outputs.toJSON());

    this.model.outputs.changed.connect(this._outputChangeListener, this);

    this._trrackManager.trrackInstanceChange.connect(
      this._trrackInstanceChangeHandler,
      this
    );
  }

  // ! PRIVATE
  // ATTRS
  private _comm: Kernel.IComm | null = null;
  private _isTrracked = false;
  private _trrackManager: TrrackManager;
  private _signalDisposer = new DisposableSignal(signalInit);
  private _isCommsConnected = false;
  private _commId = '';

  // ACCESSORS

  // METHODS

  private _trrackInstanceChangeHandler() {
    const outputs = this.model.outputs.toJSON();
    const executeResultOutputIdx = outputs.findIndex(
      o => o.output_type === 'execute_result'
    );

    if (executeResultOutputIdx === -1) return;

    const output = this.model.outputs.get(executeResultOutputIdx);

    if (output.type !== 'execute_result' && output.type !== 'stream')
      console.log(output.type);

    if (output.type !== 'execute_result') return;

    const data = output.data as any;

    data[TRRACK_MIME_TYPE][TRRACK_GRAPH_MIME_TYPE] = this._trrackManager.root;

    output.setData({
      data,
      metadata: output.metadata || {}
    });
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    { type, newIndex }: IOutputAreaModel.ChangedArgs
  ) {
    if (!this._isTrracked && model.length > 0) this._isTrracked = true;

    if (type !== ('ad' as any)) return;

    const output = model.get(newIndex);

    if (output.type !== 'execute_result' && output.type !== 'stream')
      console.log('Unhandled output type', output.type, output);

    if (output.type !== 'execute_result') return;

    output.setData({
      data: {
        [TRRACK_MIME_TYPE]: {
          ...output.data,
          [TRRACK_GRAPH_MIME_TYPE]: this._trrackManager.root
        }
      },
      metadata: output.metadata || {}
    });
  }

  private async _setupServerComms(
    kernel: Kernel.IKernelConnection,
    target: string
  ) {
    return kernel.requestExecute({
      code: `from trracked_cells.comms import get_comm\nget_comm("${target}")`
    }).done;
  }

  private get _promptStatusNode() {
    const promptStatusNode = this.inputArea.promptNode.querySelector(
      `.${INPUT_PROMPT_STATUS}`
    );

    return promptStatusNode;
  }

  monitorKernelStatus(
    kernel: Kernel.IKernelConnection,
    status: Kernel.ConnectionStatus
  ) {
    if (status !== 'connected') {
      this.destroyComm(kernel, 'kernel');
      this._setCommConnectedStatus(false);
    }
  }

  _setCommConnectedStatus(is: boolean) {
    if (!this._promptStatusNode) return;
    if (this._isCommsConnected === is) return;

    this._isCommsConnected = is;

    this._promptStatusNode.classList.remove(INPUT_PROMPT_DISPLAY_NONE);

    this._promptStatusNode.classList.toggle(INPUT_PROMPT_CONNECTED, is);
    this._promptStatusNode.classList.toggle(INPUT_PROMPT_DISCONNECTED, !is);
  }

  // ! PUBLIC
  // ATTRS
  get comm() {
    return this._comm;
  }

  get isCommsConnected() {
    return this._isCommsConnected;
  }

  // ACCESSORS

  // METHODS

  destroyComm(kernel: Kernel.IKernelConnection, reason: MessageReason) {
    if (this._comm) {
      if (kernel.hasComm(this._commId) && !reason) {
        this._comm.close({
          reason
        } as MsgData);
      }
      this._comm.dispose();
      this._comm = null;
    }
  }

  destroyCommForReset(kernel: Kernel.IKernelConnection) {
    this.destroyComm(kernel, 'reset');
  }

  async setupComms(kernel: Kernel.IKernelConnection) {
    this.destroyCommForReset(kernel);

    const COMM_TARGET = this.model.id;
    await this._setupServerComms(kernel, COMM_TARGET);

    this._comm = kernel.createComm(COMM_TARGET);
    this._comm.onMsg = msg => {
      if (KernelMessage.isCommMsgMsg(msg)) {
        const data = getData(msg);

        if (data.reason === 'ack') {
          this._setCommConnectedStatus(true);
          this._commId = this._comm?.commId || '';
        }
      }
    };

    await this._comm.open().done;

    return this._comm;
  }

  dispose(): void {
    this._trrackManager.dispose();
    this._signalDisposer.dispose();
    super.dispose();
  }
}

export namespace TrrackedCell {
  export function isTrrackedCell(cell: Cell): cell is TrrackedCell {
    return cell instanceof TrrackedCell;
  }
}
