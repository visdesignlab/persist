import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';
import { Intent } from '../intent/types';
import { AggregateOperation } from '../vegaL/spec/aggregate';

export type Note = {
  createdOn: number;
  note: string;
};

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

  export type SortAction = BaseInteraction & {
    type: 'sort';
    direction: 'ascending' | 'descending';
    col: string;
  };

  export type AggregateAction = BaseInteraction & {
    type: 'aggregate';
    agg_name: string;
    op: AggregateOperation;
  };

  export type CategoryAction = BaseInteraction & {
    type: 'categorize';
    categoryName: string;
    selectedOption: string;
  };

  export type LabelAction = BaseInteraction & {
    type: 'label';
    label: string;
  };

  export type NotesAction = BaseInteraction & {
    type: 'note';
    note: Note;
  };

  export type RenameColumnAction = BaseInteraction & {
    type: 'rename-column';
    prev_column_name: string;
    new_column_name: string;
  };

  export type IntentSelectionAction = BaseInteraction & {
    type: 'intent';
    intent: Intent;
  };
}

export type Interaction =
  | Interactions.ChartCreationAction
  | Interactions.SelectionAction
  | Interactions.FilterAction
  | Interactions.LabelAction
  | Interactions.AggregateAction
  | Interactions.CategoryAction
  | Interactions.NotesAction
  | Interactions.RenameColumnAction
  | Interactions.SortAction
  | Interactions.IntentSelectionAction;

export type Interactions = Array<Interaction>;
