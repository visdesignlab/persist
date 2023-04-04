import { UUID } from '@lumino/coreutils';
import { SelectionInterval } from '../../../types';
import { IDEGlobal, debounce } from '../../../utils';
import { ITrrackManager } from '../trrackManager';
import { VegaManager } from './vegaManager';

export function getSelectionIntervalListener({
  manager,
  selectionPath,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  selectionPath: any;
  trrackManager: ITrrackManager;
  cellId: string;
}) {
  const selector = selectionPath.parentProperty;
  const path = selectionPath.pointer;

  const { view, renderer } = manager;

  if (!renderer || !view) throw new Error('Vega or view not found');

  const cell = IDEGlobal.cells.get(cellId);
  if (!cell) throw new Error("Cell doesn't exist");

  return debounce(async () => {
    const state = view.getState();

    const signals = state.signals;

    const params: SelectionInterval['params'] = {
      selection: signals[selector],
      x: signals[`${selector}_x`],
      y: signals[`${selector}_y`]
    };

    const selection: SelectionInterval = {
      id: UUID.uuid4(),
      type: 'selection_interval',
      name: selector,
      path,
      params
    };

    await trrackManager.addInteraction(selection, 'Brush selection');
  });
}
