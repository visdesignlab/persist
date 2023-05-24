import {
  SelectionParameter,
  SelectionType,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';

export namespace Interactions {
  export type BaseInteraction = {
    id: string;
    type: unknown;
  };

  export type ChartCreationAction = {
    id: string;
    type: 'create';
  };

  export type SelectionAction<T extends SelectionType> = Omit<
    BaseInteraction,
    'type'
  > &
    SelectionParameter<T> &
    Pick<TopLevelSelectionParameter, 'views'> & {
      type: T;
    };

  export type FilterAction = BaseInteraction & {
    type: 'filter';
    direction: 'in' | 'out';
  };

  export type AggregateAction = BaseInteraction & {
    type: 'aggregate';
  };

  export type LabelAction = BaseInteraction & {
    type: 'label';
  };
}

export type Interaction =
  | Interactions.ChartCreationAction
  | Interactions.SelectionAction<'interval'>
  | Interactions.SelectionAction<'point'>
  | Interactions.FilterAction
  | Interactions.LabelAction
  | Interactions.AggregateAction;

export type Interactions = Array<Interaction>;
