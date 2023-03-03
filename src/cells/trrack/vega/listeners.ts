import { JSONValue, UUID } from '@lumino/coreutils';
import { applyPatch, deepClone } from 'fast-json-patch';
import { SelectionInterval, SelectionIntervalInit } from '../../../types';
import { debounce, IDEGlobal } from '../../../utils';
import { ITrrackManager } from '../trrackManager';
import { VegaManager } from './vegaManager';

export function getSelectionIntervalListener({
  manager,
  spec,
  selectionPath,
  trrackManager,
  cellId
}: {
  manager: VegaManager;
  spec: JSONValue;
  selectionPath: any;
  trrackManager: ITrrackManager;
  cellId: string;
}) {
  const selector = selectionPath.parentProperty;
  const path = selectionPath.pointer;

  const { view, vegaRenderer } = manager;

  if (!vegaRenderer || !view) throw new Error('Vega or view not found');

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

    const selectionInit: SelectionIntervalInit = {};
    Object.entries(params.selection).forEach(([dim, range]) => {
      selectionInit[dim] = range;
    });

    const newSpec = applyInitToSelection(selectionInit, spec, path);

    const selection: SelectionInterval = {
      id: UUID.uuid4(),
      type: 'selection_interval',
      name: selector,
      path,
      params,
      spec: newSpec
    };

    await trrackManager.addInteraction(selection, 'Brush selection');
    cell.updateVegaSpec(newSpec);
  });
}

function applyInitToSelection(
  init: SelectionIntervalInit,
  spec: JSONValue,
  path: string
) {
  const newSpec = applyPatch(JSON.parse(JSON.stringify(spec)), [
    {
      op: 'replace',
      path: `${path}/init`,
      value: deepClone(init)
    }
  ]);

  return newSpec.newDocument;
}
