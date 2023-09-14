import { Field, TypedFieldDef } from 'vega-lite/build/src/channeldef';
import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';

export type SelectionStore = Array<unknown>;

export type SelectionValueType = {
  value: SelectionParameter['value'];
  store: SelectionStore;
  encodingTypes: Record<string, TypedFieldDef<Field>>;
};

export type SelectionCommandArg = BaseCommandArg &
  SelectionValueType & {
    selection: SelectionParameter;
  };

export type SelectionAction = BaseInteraction &
  Omit<SelectionParameter, 'value'> &
  Pick<TopLevelSelectionParameter, 'views'> & {
    type: 'select';
    selected: SelectionValueType;
  };

export function createSelectionActionAndLabelLike(
  selection: SelectionParameter,
  selected: SelectionValueType
): ActionAndLabelLike<SelectionAction> {
  return {
    action: {
      ...selection,
      id: UUID(),
      type: 'select',
      selected
    },
    label: () => {
      return 'Range selection over...';
    }
  };
}
