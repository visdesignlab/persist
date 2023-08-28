import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { Loader, LoadingOverlay, Stack } from '@mantine/core';
import { Nullable } from '../../utils';
import { TrrackableCell } from '../trrackableCell';

type Props = {
  show: boolean;
};

function OutputLoader({ show }: Props) {
  return (
    <LoadingOverlay
      visible={show}
      overlayBlur={2}
      loader={
        <Stack>
          <Loader />
          Applying
        </Stack>
      }
    />
  );
}

function OutputLoaderWithSignal({ signal }: { signal: ISignal<any, boolean> }) {
  return (
    <UseSignal signal={signal}>
      {(_, show) => <OutputLoader show={!!show} />}
    </UseSignal>
  );
}

export class OutputLoaderWidget extends ReactWidget {
  private _showSignal = new Signal<this, boolean>(this);
  private _cell: Nullable<TrrackableCell> = null;
  private _unsubscribe: () => void = () => {
    //
  };

  async associateCell(cell: TrrackableCell) {
    this.show();
    this.render();

    await this.renderPromise;

    if (cell !== this._cell) {
      this._cell = cell;
    }

    this._unsubscribe();
    this._unsubscribe = cell.isApplying.subscribe(isApplying => {
      this._showSignal.emit(isApplying);
    });
  }

  dispose(): void {
    super.dispose();
    Signal.disconnectAll(this);
    this._unsubscribe();
  }

  render() {
    return <OutputLoaderWithSignal signal={this._showSignal} />;
  }
}
