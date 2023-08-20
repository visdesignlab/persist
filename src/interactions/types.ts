import {
  SelectionParameter,
  TopLevelSelectionParameter
} from 'vega-lite/build/src/selection';
import { Prediction } from '../intent/types';
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

  export type InvertSelectionAction = BaseInteraction & {
    type: 'invert-selection';
  };

  export type FilterAction = BaseInteraction & {
    type: 'filter';
    direction: 'in' | 'out';
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
    prevColumnName: string;
    newColumnName: string;
  };

  export type DropColumnAction = BaseInteraction & {
    type: 'drop-columns';
    columnNames: string[];
  };

  export type IntentSelectionAction = BaseInteraction & {
    type: 'intent';
    intent: Prediction;
  };
}

export type Interaction =
  | Interactions.ChartCreationAction
  | Interactions.SelectionAction
  | Interactions.InvertSelectionAction
  | Interactions.FilterAction
  | Interactions.LabelAction
  | Interactions.AggregateAction
  | Interactions.CategoryAction
  | Interactions.NotesAction
  | Interactions.RenameColumnAction
  | Interactions.DropColumnAction
  | Interactions.IntentSelectionAction;

export type Interactions = Array<Interaction>;
