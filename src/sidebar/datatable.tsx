import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import { TrrackableCell } from '../cells';
import { Nullable } from '../utils';
import DataTable from 'react-data-table-component';
import { DatatableComponent } from './DatatableComponent';

export class RenderedDataTable extends ReactWidget {
  private _cell: Nullable<TrrackableCell> = null;
  private _cellChange: Signal<this, TrrackableCell> = new Signal(this);
  private _data: Record<string, any> | null = null;
  private columns: Record<string, any>[] = [];
  private points: Record<string, any>[] = [];

  async tryRender(
    cell: TrrackableCell,
    data: { 'application/vnd.vega.v5+json': string }
  ) {
    console.log(cell, data);
    this._data = JSON.parse(data['application/vnd.vega.v5+json']);

    // const [filterText, setFilterText] = React.useState('');
    // const [resetPaginationToggle, setResetPaginationToggle] =
    //   React.useState(false);

    console.log(this._data);

    this.show();
    this.render();
    await this.renderPromise;

    this.columns = !this._data
      ? []
      : Object.keys(this._data).map(key => ({
          minWidth: '100px',
          name: key,
          sortable: true,
          selector: (row: any) => row[key]
        }));

    //TODO:: This is technically bugged in that it doesnt get rows that are missing from the first column.
    this.points = !this._data
      ? []
      : Object.keys(this._data[Object.keys(this._data)[0]]).map((val: any) => {
          const temp: Record<string, string | number> = {};
          Object.keys(this._data!).forEach(
            key => (temp[key] = this._data![key][val])
          );
          return temp;
        });

    // const filteredItems = fakeUsers.filter(
    //   item =>
    //     item.name && item.name.toLowerCase().includes(filterText.toLowerCase())
    // );

    if (cell !== this._cell) {
      this._cell = cell;
      this._cell.data = this.points;
      this._cell.columns = this.columns.map(col => col.name);
      this._cellChange.emit(this._cell);
    }
  }

  render() {
    return (
      <UseSignal signal={this._cellChange}>
        {(_, cell) => (
          <DatatableComponent
            data={this.points}
            columns={this.columns}
            cell={this._cell}
          />
        )}
      </UseSignal>
    );
  }
}
