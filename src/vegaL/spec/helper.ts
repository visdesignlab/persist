import { SingleDefUnitChannel } from 'vega-lite/build/src/channel';
import { isDateTime } from 'vega-lite/build/src/datetime';
import {
  SelectionInit,
  SelectionParameter
} from 'vega-lite/build/src/selection';
import { isSelectionInterval } from './selection';
import { HasParams } from './spec';

type ParameterValue = Exclude<HasParams['params'], undefined>;

export type JSONPathResult<T = any> = Array<{
  path: string;
  value: T;
  parent: any[];
  pointer: string;
  hasArrExpr: boolean;
  parentProperty: string;
}>;

export function setParameterValue(
  spec: HasParams,
  parameterName: string,
  parameterValue: ParameterValue[number]['value']
) {
  const params = spec.params || [];

  const paramToUpdate = params.find(p => p.name === parameterName);

  if (paramToUpdate) paramToUpdate.value = parameterValue;
}

export function isSelectionInit(val: any): val is SelectionInit {
  return val && (typeof val !== 'object' || isDateTime(val));
}

export function getPredicateFromSelection(selection: SelectionParameter) {
  if (isSelectionInterval(selection)) {
    const { select } = selection;
    const encodings: SingleDefUnitChannel[] =
      (typeof select === 'string' ? ['x', 'y'] : select.encodings) || [];

    if (encodings.length > 2 || encodings.some(e => !['x', 'y'].includes(e))) {
      console.warn(
        `Incorrect encodings [${encodings.join(
          ', '
        )}] for interval selection. Expected 'x' or 'y'`
      );

      return undefined;
    }
  }
}
