import { createRender } from '@anywidget/react';
import React from 'react';
import { TrrackableCell } from '../../cells';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Header({ cell }: Props) {
  return <div>Header {cell.cell_id}</div>;
}

export const render = createRender(withTrrackableCell(Header));
