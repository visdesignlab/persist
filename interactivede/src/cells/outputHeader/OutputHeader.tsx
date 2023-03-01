/* eslint-disable @typescript-eslint/no-empty-function */
import { Button } from '@jupyterlab/ui-components';
import { JSONPath as jp } from 'jsonpath-plus';
import React from 'react';
import { IDEGlobal } from '../../utils';
import { ITrrackManager, TrrackCurrentChange } from '../trrack';
import { TrrackableCell } from '../trrackableCell';

const OUTPUT_HEADER_BTN_CLASS = 'jp-OutputHeaderWidget-btn';

type Props = {
  cell: TrrackableCell;
};

type ButtonAttrs<T extends (...args: unknown[]) => void> = {
  disabled: boolean;
  action: T;
};

type State = {
  reset: ButtonAttrs<() => void>;
  filter: ButtonAttrs<() => void>;
  dataFrameList: string[];
};

const dataFrameList: string[] = [];

export class OutputHeader extends React.Component<Props, State> {
  private fn: any;
  private manager: ITrrackManager;

  constructor(props: Props) {
    super(props);

    const cell = this.props.cell;
    const tManager = IDEGlobal.trracks.get(cell.cellId);
    if (!tManager) throw new Error("Can't find TrrackManager for cell");

    this.fn = (_: unknown, args: TrrackCurrentChange) => {
      const state = this.state;

      state.reset.disabled = tManager.hasOnlyRoot;
      state.filter.disabled = false;

      this.setState(state);
    };

    tManager.currentChange.connect(this.fn, this);
    this.manager = tManager;

    this.state = {
      reset: {
        disabled: tManager.hasOnlyRoot,
        action: () => tManager.reset()
      },
      filter: {
        disabled: false,
        action: () => filter(this.props.cell)
      },
      dataFrameList
    };
  }

  componentWillUnmount() {
    this.manager.currentChange.disconnect(this.fn, this);
  }

  render() {
    const { reset, filter } = this.state;
    return (
      <>
        <Button
          disabled={reset.disabled}
          onClick={reset.action}
          className={OUTPUT_HEADER_BTN_CLASS}
        >
          Reset
        </Button>
        <Button
          disabled={filter.disabled}
          onClick={filter.action}
          className={OUTPUT_HEADER_BTN_CLASS}
        >
          Filter
        </Button>
        <Button
          onClick={() => {
            console.clear();

            const view = IDEGlobal.views.get(this.props.cell.cellId);
            if (!view) return;

            const dataPaths = jp({
              path: '$..data..name',
              json: view.vega?.vgSpec || {},
              resultType: 'all'
            }) as any[];

            const dataSource = dataPaths.find(d => d.value.includes('source'));

            const data = view.vega?.view.data(dataSource.value);

            const dataString = JSON.stringify(data);

            const dfName = `data_${this.manager.current}`;

            IDEGlobal.executor
              ?.execute(`ext_df = pd.read_json('${dataString}')`, {
                withPandas: true
              })
              ?.done.then(() => {
                if (!this.state.dataFrameList.includes(dfName)) {
                  this.setState(s => ({
                    dataFrameList: [...s.dataFrameList, dfName]
                  }));
                  dataFrameList.push(dfName);
                }
              });
          }}
          className={OUTPUT_HEADER_BTN_CLASS}
        >
          Extract dataframe
        </Button>
      </>
    );
  }
}

function getAll(cell: TrrackableCell) {
  const cellId = cell.cellId;
  const vega = IDEGlobal.views.get(cellId);
  if (!vega) return;

  const trrack = IDEGlobal.trracks.get(cellId);
  if (!trrack) return;

  return {
    vega,
    trrack
  };
}

async function filter(cell: TrrackableCell) {
  const managers = getAll(cell);
  if (!managers) return;
  const { vega, trrack } = managers;

  if (!vega && !trrack) return;

  vega.filter();
}
