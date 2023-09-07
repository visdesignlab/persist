import { createRender, useModelState } from '@anywidget/react';
import { Stack } from '@mantine/core';
import React from 'react';
import { VegaLite } from 'react-vega';
import { TopLevelSpec } from 'vega-lite';
import { TrrackableCell } from '../../cells';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Vegalite({ cell }: Props) {
  console.log('Hello Vegalite');

  const [spec, _] = useModelState<TopLevelSpec>('spec');

  return (
    <Stack>
      <div>Body {cell.cell_id}</div>
      <VegaLite spec={spec} />
    </Stack>
  );
}

export const render = createRender(withTrrackableCell(Vegalite));
