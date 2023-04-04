/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import { CommandButton } from '../../components/CommandButton';
import { ITrrackManager } from '../trrack';
import { TrrackableCell } from '../trrackableCell';
import { OutputCommandIds, OutputCommandRegistry } from './commands';

type Props = {
  cell: TrrackableCell;
};

type State = {
  dataFrameList: string[];
};

export class OutputHeader extends React.Component<Props, State> {
  private fn: any;
  private manager: ITrrackManager;
  private _commands = [OutputCommandIds.reset, OutputCommandIds.filter];
  _outputCommRegistry: OutputCommandRegistry;

  constructor(props: Props) {
    super(props);
    this._outputCommRegistry = new OutputCommandRegistry(this.props.cell);

    const cell = this.props.cell;
    const tManager = cell.trrackManager;
    if (!tManager) throw new Error("Can't find TrrackManager for cell");

    this.manager = tManager;
  }

  componentWillUnmount() {
    this.manager.currentChange.disconnect(this.fn, this);
  }

  render() {
    return (
      <>
        {this._commands.map(id => (
          <CommandButton
            commands={this._outputCommRegistry.commands}
            cId={id}
          />
        ))}
      </>
    );
  }
}
