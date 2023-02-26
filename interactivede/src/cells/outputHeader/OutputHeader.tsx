/* eslint-disable @typescript-eslint/no-empty-function */
import { Button } from '@jupyterlab/ui-components';
import React from 'react';
import { IDEGlobal } from '../../utils/IDEGlobal';
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
};

export class OutputHeader extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const cell = this.props.cell;
    const tManager = IDEGlobal.trracks.get(cell.cellId);
    if (!tManager) throw new Error("Can't find TrrackManager for cell");

    tManager.trrack.currentChange(() => {
      const state = this.state;

      state.reset.disabled = tManager.hasOnlyRoot;
      state.filter.disabled = true;

      this.setState(state);
    });

    this.state = {
      reset: {
        disabled: tManager.hasOnlyRoot,
        action: () => tManager.reset()
      },
      filter: {
        disabled: true,
        action: () => {}
      }
    };
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
      </>
    );
  }
}
