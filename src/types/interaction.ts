import { Range } from '../vega/types';

type BaseInteraction = {
  id: string;
  type: string;
  path: string;
};

type BaseSelection = BaseInteraction;

export type SelectionInterval = BaseSelection & {
  type: 'selection_interval';
  name: string;
  params: {
    x: string;
    y: string;
    domain: {
      x: Range<2>;
      y: Range<2>;
    };
    pixel: {
      x: Range<2>;
      y: Range<2>;
    };
  };
};

export type SelectionParams<SelectionType> = SelectionType extends {
  params: infer P;
}
  ? P
  : never;

export type SelectionSingle = BaseSelection & {
  type: 'selection_single';
};

export type SelectionMultiple = BaseSelection & {
  type: 'selection_multiple';
};

export type Selection = SelectionInterval | SelectionSingle | SelectionMultiple;

export type Filter = BaseInteraction & {
  type: 'filter';
};

export type Label = BaseInteraction & {
  type: 'filter';
};

export type Interaction = Selection | Filter | Label;

export type Interactions = Array<Interaction>;

export function isSelectionInterval(
  interaction: Interaction
): interaction is SelectionInterval {
  return interaction.type === 'selection_interval';
}
