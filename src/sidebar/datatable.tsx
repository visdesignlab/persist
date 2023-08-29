import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import { TrrackableCell } from '../cells';
import { Nullable } from '../utils';
import { DatatableComponent } from './DatatableComponent';

export class RenderedDataTable extends ReactWidget {
  private _cell: Nullable<TrrackableCell> = null;
  private _cellChange: Signal<this, TrrackableCell> = new Signal(this);
  private _data: Record<string, any>[] | null = null;
  private columns: Record<string, any>[] = [];

  async tryRender(cell: TrrackableCell, data: Record<string, any>[]) {
    this._data = data;

    this.show();
    this.render();
    await this.renderPromise;

    this.columns = !this._data
      ? []
      : Object.keys(this._data[0])
          .filter(k => k !== '__selected')
          .map(key => ({
            minWidth: '100px',
            name: key,
            sortable: true,
            reorder: true,
            selector: (row: any) => row[key]
          }));

    if (this._cell) {
      this._cell.selectedRows = this._data.filter(
        point =>
          point.__selected || (point.__invert_selected && !point.__selected)
      );
    }

    this._cell = cell;
    if (!this._cell.originalData && data.length > 0) {
      this._cell.originalData = data;
    }

    this._cell.data = this._data;
    this._cell.columns = this.columns.map(col => col.name);
    this._cellChange.emit(this._cell);
  }

  render() {
    return (
      <UseSignal signal={this._cellChange}>
        {(_, cell) =>
          this._data && this._cell ? (
            <DatatableComponent
              data={this._data}
              originalData={this._cell.originalData}
              columns={this.columns}
              cell={this._cell}
              onUpdate={data =>
                this._cell ? this.tryRender(this._cell, data) : null
              }
            />
          ) : null
        }
      </UseSignal>
    );
  }
}
