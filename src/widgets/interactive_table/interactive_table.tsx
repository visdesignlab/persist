import { createRender } from '@anywidget/react';
import { withTrrackableCell } from '../utils/useCell';
import { DatatableComponent } from './DatatableComponent';

const render = createRender(withTrrackableCell(DatatableComponent));

export default { render };
