import { createRender } from '@anywidget/react';
import React from 'react';
import { TrrackableCell } from '../../cells';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Body({ cell }: Props) {
  return <div>Body {cell.cell_id}</div>;
}

export const render = createRender(withTrrackableCell(Body));
