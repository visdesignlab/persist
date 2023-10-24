import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';

import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';
import { parseStringify } from '../utils/jsonHelpers';
import { isNumeric } from 'vega-lite';

export type SelectionStore = Array<{
  field: string;
  type: 'E' | 'R';
  channel: string;
  values: Array<any>;
}>;

export type SelectionValueType = {
  name: string;
  value: SelectionParameter['value'];
  store: SelectionStore;
  brush_type: 'point' | 'interval';
};

// Action
export type SelectionAction = BaseInteraction &
  Pick<TopLevelSelectionParameter, 'views'> & {
    type: 'select';
  } & SelectionValueType;

// Action Creator
export function createSelectionActionAndLabelLike(
  selected: SelectionValueType
): ActionAndLabelLike<SelectionAction> {
  return {
    action: {
      id: UUID(),
      type: 'select',
      ...selected
    },
    label: () => {
      console.log({ selected });
      const { brush_type, name, value, store } = selected;

      if (store.length === 0) {
        return 'Clear all selections';
      }

      if (brush_type === 'interval') {
        const val = value as Record<string, any[]>;

        const sel_strings: string[] = [];

        Object.entries(val).forEach(([k, v]) => {
          const str = `${k} (${
            v[0] instanceof Date
              ? v[0].toUTCString()
              : isNumeric(v[0])
              ? Math.round(v[0])
              : v[0]
          } to ${
            v[v.length - 1] instanceof Date
              ? v[v.length - 1].toUTCString()
              : isNumeric(v[v.length - 1])
              ? Math.round(v[v.length - 1])
              : v[v.length - 1]
          })`;
          sel_strings.push(str);
        });

        return 'Selected ' + sel_strings.join(', ');
      } else {
        const val: any = value;
        if (val['vlPoint'] && val['vlPoint']['or']) {
          const arr = val.vlPoint.or;

          if (arr.length > 0) {
            return `Selected ${arr.length} ${
              arr.length === 1 ? 'point' : 'points'
            } across ${Object.keys(arr[0]).join(', ')}`;
          }
        } else if (name === 'index_selection') {
          const arr = value as any[];
          return arr.length === 1
            ? `Selected ${arr.length} point`
            : `Selected ${arr.length} points`;
        }
      }

      return 'Selected Points!';
    }
  };
}

// Command
export type SelectionCommandArgs = BaseCommandArg &
  SelectionValueType & {
    name: string;
  };

// Command Option
export const selectionCommandOption: CommandRegistry.ICommandOptions = {
  execute(args: ReadonlyPartialJSONObject) {
    const { cell, name, value, store, brush_type } =
      castArgs<SelectionCommandArgs>(args);

    const { action, label } = createSelectionActionAndLabelLike({
      value,
      name,
      store: parseStringify(store),
      brush_type
    });

    return cell.trrackManager.apply(action, label);
  }
};
