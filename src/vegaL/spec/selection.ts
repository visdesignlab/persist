import embed from 'vega-embed';
import { compile } from 'vega-lite';
import { VariableParameter } from 'vega-lite/build/src/parameter';
import {
  SELECTION_ID,
  SelectionInitIntervalMapping,
  SelectionParameter,
  TopLevelSelectionParameter,
  isSelectionParameter
} from 'vega-lite/build/src/selection';
import { TopLevelParameter } from 'vega-lite/build/src/spec/toplevel';
import { SelectionInteractionGroups } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { VegaLiteSpecProcessor } from './processor';

/**
 * All selections are maps between field names and initial values
 *
 * POINT SELECTIONS
 * Array of such mappings e.g:
 * [
 *   {"Cylinders": 4, "Year": 1981},
 *   {"Cylinders": 8, "Year": 1972}
 * ]
 *
 * INTERVAL SELECTIONS
 * Single object with field names and value array. e.g:
 *
 * {"x": [55, 160], "y": [13, 37]}
 *
 */

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

export async function applyInvertSelection(
  vlProc: VegaLiteSpecProcessor,
  selectionGroup: SelectionInteractionGroups
) {
  selectionGroup;

  const div = document.createElement('div');
  const vg = compile(vlProc.spec);

  const { view } = await embed(div, vg.spec);

  view;

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

export function removeParameterValue<
  T extends VariableParameter | SelectionParameter
>(param: T): T {
  delete param.value;
  return param;
}

export function convertTimeStampIntervalToDateTime(
  selections: SelectionInitIntervalMapping,
  validColumn: string[]
) {
  const sels = { ...selections };

  Object.entries(sels).forEach(([k, val]: any) => {
    if (validColumn.includes(k)) {
      sels[k] = val.map((t: any) => {
        if (typeof t === 'number' && !t.toString().includes('.')) {
          return new Date(t).toISOString();
        }
        return t;
      });

      const vals = [...sels[k]];

      sels[k] = [vals[0], vals.slice(-1)[0]] as any;
    }
  });

  return sels;
}
