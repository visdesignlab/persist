import { VariableParameter } from 'vega-lite/build/src/parameter';
import {
  SELECTION_ID,
  SelectionParameter,
  TopLevelSelectionParameter,
  isSelectionParameter
} from 'vega-lite/build/src/selection';
import { TopLevelParameter } from 'vega-lite/build/src/spec/toplevel';
import { Interactions } from '../../interactions/types';
import { VegaLiteSpecProcessor } from './processor';

export const DEF_POINT_SELECTION_ID = SELECTION_ID;

export function applySelection(
  vlProc: VegaLiteSpecProcessor,
  selection: Interactions.SelectionAction
) {
  vlProc.updateTopLevelParameter(param => {
    if (isSelectionParameter(param) && param.name === selection.name) {
      param.value = selection.value;
    }

    return param;
  });

  return vlProc;
}

export function isTopLevelSelectionParameter(
  selection: TopLevelParameter
): selection is TopLevelSelectionParameter {
  return isSelectionParameter(selection) && 'views' in selection;
}

export function isSelectionInterval(
  selection: TopLevelSelectionParameter
): selection is SelectionParameter<'interval'> {
  const { select } = selection;

  return typeof select === 'string'
    ? select === 'interval'
    : select.type === 'interval';
}

export function isSelectionPoint(
  selection: TopLevelSelectionParameter
): selection is SelectionParameter<'point'> {
  const { select } = selection;

  return typeof select === 'string'
    ? select === 'point'
    : select.type === 'point';
}

export function getEncodingsForSelection(selection: SelectionParameter) {
  const { select } = selection;
  return typeof select === 'object' ? select.encodings || [] : [];
}

export function removeParameterValue(
  param: VariableParameter | SelectionParameter
) {
  delete param.value;
  return param;
}
