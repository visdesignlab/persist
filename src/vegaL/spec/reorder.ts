import { LogicalComposition } from 'vega-lite/build/src/logical';
import { Predicate } from 'vega-lite/build/src/predicate';
import { Interactions } from '../../interactions/types';
import { VegaLiteSpecProcessor } from './processor';

export type Sort = LogicalComposition<Predicate>;
export type SortDirection = 'ascending' | 'descending';

/**
 * @param vlProc - processor object
 * @returns processor object
 *
 * NOTE: filter operations only adds one layer
 */
export function applyReorder(
  vlProc: VegaLiteSpecProcessor,
  _reorderAction: Interactions.ReorderAction
): VegaLiteSpecProcessor {
  return vlProc;
}
