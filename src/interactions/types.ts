import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';
import { AggregateOperation } from '../vegaL/spec/aggregate';

export namespace Interactions {
  export type BaseInteraction = {
    id: string;
    type: unknown;
  };

  export type ChartCreationAction = {
    id: string;
    type: 'create';
  };

  export type SelectionAction = BaseInteraction &
    SelectionParameter &
    Pick<TopLevelSelectionParameter, 'views'> & {
      type: 'selection';
    };

  export type FilterAction = BaseInteraction & {
    type: 'filter';
    direction: 'in' | 'out';
  };

  export type AggregateAction = BaseInteraction & {
    type: 'aggregate';
    agg_name: `_Agg_${string}`;
    op: AggregateOperation;
  };

  export type LabelAction = BaseInteraction & {
    type: 'label';
  };

  export type RenameColumn = BaseInteraction & {
    type: 'rename-column';
    prev_column_name: string;
    new_column_name: string;
  };
}

export type Interaction =
  | Interactions.ChartCreationAction
  | Interactions.SelectionAction
  | Interactions.FilterAction
  | Interactions.LabelAction
  | Interactions.AggregateAction;

export type Interactions = Array<Interaction>;
