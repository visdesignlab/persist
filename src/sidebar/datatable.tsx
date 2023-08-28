import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { TrrackableCell } from '../cells';
import { Nullable } from '../utils';
import DataTable from 'react-data-table-component';
import { DatatableComponent } from './DatatableComponent';

export class RenderedDataTable extends ReactWidget {
  private _cell: Nullable<TrrackableCell> = null;
  private _cellChange: Signal<this, TrrackableCell> = new Signal(this);
  private _data: Record<string, any>[] | null = null;
  private _originalData: Record<string, any>[] | null = null;
  private columns: Record<string, any>[] = [];
  private points: Record<string, any>[] = [];

  async tryRender(cell: TrrackableCell, data: Record<string, any>[]) {
    this._data = data;

    // const [filterText, setFilterText] = React.useState('');
    // const [resetPaginationToggle, setResetPaginationToggle] =
    //   React.useState(false);

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

    //TODO:: This is technically bugged in that it doesnt get rows that are missing from the first column.
    // const newPoints = !this._data
    //   ? []
    //   : Object.keys(this._data[Object.keys(this._data)[0]]).map((val: any) => {
    //       const temp: Record<string, string | number> = {};
    //       Object.keys(this._data!).forEach(
    //         key => (temp[key] = this._data![key][val])
    //       );
    //       return temp;
    //     });

    this.points = data;
    if (!this._originalData) {
      this._originalData = this.points;
    }

    if (this._cell) {
      this._cell.selectedRows = this.points.filter(
        point =>
          point.__selected || (point.__invert_selected && !point.__selected)
      );
    }

    // const filteredItems = fakeUsers.filter(
    //   item =>
    //     item.name && item.name.toLowerCase().includes(filterText.toLowerCase())
    // );

    this._cell = cell;
    this._cell.data = this.points;
    this._cell.columns = this.columns.map(col => col.name);
    this._cellChange.emit(this._cell);
  }

  render() {
    return (
      <UseSignal signal={this._cellChange}>
        {(_, cell) => (
          <DatatableComponent
            data={this.points}
            originalData={this._originalData}
            columns={this.columns}
            cell={this._cell}
            onUpdate={data =>
              this._cell ? this.tryRender(this._cell, data) : null
            }
          />
        )}
      </UseSignal>
    );
  }
}
