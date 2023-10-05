import { DatatableComponent } from './DatatableComponent';
import { createRender } from '@anywidget/react';
import { withTrrackableCell } from '../utils/useCell';

export const render = createRender(withTrrackableCell(DatatableComponent));
