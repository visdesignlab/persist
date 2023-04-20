import { JSONValue } from '@lumino/coreutils';
import {
  IntervalSelection,
  SelectionDef,
  SingleSelection
} from 'vl4/build/src/selection';
import { VL4 } from './spec';

export function isSelectionInterval(
  selection: SelectionDef | undefined
): selection is IntervalSelection {
  return selection?.type === 'interval';
}

export function isSelectionSingle(
  selection: SelectionDef | undefined
): selection is SingleSelection {
  return selection?.type === 'single';
}

export function isSelectionMulti(
  selection: SelectionDef | undefined
): selection is SingleSelection {
  //
  return selection?.type === 'multi';
}

export function isValidVegalite4Spec(
  spec: JSONValue | VL4.Spec
): spec is VL4.Spec {
  return true;
}
