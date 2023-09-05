import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import { TrrackableCell } from '../../cells';
import { Nullable } from '../../utils';
import { DatatableComponent } from './DatatableComponent';
import { ColumnDef, createColumnHelper } from '@tanstack/table-core';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Text } from '@mantine/core';
import { RowValue } from './RowValue';

export class RenderedDataTable extends ReactWidget {
  private _cell: Nullable<TrrackableCell> = null;
  private _cellChange: Signal<this, TrrackableCell> = new Signal(this);
  private _data: Record<string, any>[] | null = null;
  private columns: ColumnDef<Record<string, any>, any>[] = [];

  async tryRender(cell: TrrackableCell, data: Record<string, any>[]) {
    this._data = data;

    this.show();
    this.render();
    await this.renderPromise;

    const columnHelper = createColumnHelper<Record<string, any>>();

    this.columns = !this._data
      ? []
      : Object.keys(this._data[0])
          .filter(k => k !== '__selected')
          .map(key =>
            columnHelper.accessor(key, {
              id: key,
              size: 100,
              enableSorting: true,
              cell: info => {
                return this._cell ? (
                  <RowValue
                    val={info.getValue()}
                    col={key}
                    cell={this._cell}
                    index={(+info.row.id || 1) - 1}
                  ></RowValue>
                ) : null;
              },
              header: () => (
                <Text
                  style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {key}
                </Text>
              )
            })
          );

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
    this._cell.columns = this.columns.map(col => col.id!);
    this._cellChange.emit(this._cell);
  }

  render() {
    return (
      <UseSignal signal={this._cellChange}>
        {(_, cell) =>
          this._data && this._cell ? (
            <DndProvider backend={HTML5Backend}>
              <DatatableComponent
                data={this._data}
                originalData={this._cell.originalData}
                columns={this.columns}
                cell={this._cell}
                onUpdate={data =>
                  this._cell ? this.tryRender(this._cell, data) : null
                }
              />
            </DndProvider>
          ) : null
        }
      </UseSignal>
    );
  }
}
