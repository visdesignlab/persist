import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { TrrackableCell } from '../cells';
import { Nullable } from '../utils';
import { SidebarComponent } from './component';

type Props = {
  cellChange: ISignal<RenderedSidebar, TrrackableCell>;
};

export function SignalledSidebarComponent({ cellChange }: Props) {
  return (
    <UseSignal signal={cellChange}>
      {(_, cell) => (cell ? <SidebarComponent cell={cell} /> : null)}
    </UseSignal>
  );
}

export class RenderedSidebar extends ReactWidget {
  private _cell: Nullable<TrrackableCell> = null;
  private _cellChange: Signal<this, TrrackableCell> = new Signal(this);

  async tryRender(cell: TrrackableCell) {
    this.show();
    this.render();
    await this.renderPromise;

    if (cell !== this._cell) {
      this._cell = cell;
      this._cellChange.emit(this._cell);
    }
  }

  render() {
    return <SignalledSidebarComponent cellChange={this._cellChange} />;
  }
}
