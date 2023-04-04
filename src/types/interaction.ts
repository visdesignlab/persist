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
    selection: {
      [key: string]: number[];
    };
    x: number[];
    y: number[];
  };
};

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
