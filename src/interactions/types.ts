import { IntervalSelection } from 'vl4/build/src/selection';
import { Range } from '../utils';

export type Field<Dims extends number> = {
  field: string;
  range: Range<Dims>;
};

export namespace Interactions {
  export type InteractionParams = {
    params?: unknown;
  };

  export type BaseInteraction = InteractionParams & {
    id: string;
    type: string;
    params?: unknown;
  };

  type BaseSelection = BaseInteraction;

  export type SelectionParams<SelectionType> = SelectionType extends {
    params: infer P;
  }
    ? P
    : never;

  type XIntervalSelectionParam = {
    x: Field<2>;
  };

  type YIntervalSelectionParam = {
    y: Field<2>;
  };

  // export const IntervalSelectionParams = {
  // };V

  export type IntervalSelectionAction = BaseSelection & {
    type: 'selection_interval';
    name: string;
    path: string;
    params:
      | XIntervalSelectionParam
      | YIntervalSelectionParam
      | (XIntervalSelectionParam & YIntervalSelectionParam)
      | undefined;
  };

  export namespace IntervalSelectionAction {
    export function hasX(
      params: IntervalSelectionAction['params']
    ): params is XIntervalSelectionParam {
      return params !== undefined && 'x' in params;
    }

    export function hasY(
      params: IntervalSelectionAction['params']
    ): params is YIntervalSelectionParam {
      return params !== undefined && 'y' in params;
    }

    export function is(
      interaction: Interaction
    ): interaction is IntervalSelectionAction {
      return interaction.type === 'selection_interval';
    }

    export function init({
      params
    }: IntervalSelectionAction): IntervalSelection['init'] {
      const x = params && 'x' in params && params.x.range;
      const y = params && 'y' in params && params.y.range;

      if (x && y) return { x, y };
      if (x) return { x };
      if (y) return { y };
      return undefined;
    }
  }

  export type SingleSelectionAction = BaseSelection & {
    type: 'selection_single';
    name: string;
    path: string;
    params: {
      value: number[];
    };
  };
  export namespace SingleSelectionAction {
    //
  }

  export type MultipleSelectionAction = BaseSelection & {
    type: 'selection_multiple';
  };
  export namespace MultipleSelectionAction {
    //
  }

  export type SelectionAction =
    | IntervalSelectionAction
    | SingleSelectionAction
    | MultipleSelectionAction;

  export type FilterAction = BaseInteraction & {
    type: 'filter';
  };

  export type AggregateAction = BaseInteraction & {
    type: 'aggregate';
  };

  export type LabelAction = BaseInteraction & {
    type: 'label';
  };
}

export type Interaction =
  | Interactions.SelectionAction
  | Interactions.FilterAction
  | Interactions.LabelAction
  | Interactions.AggregateAction;

export type Interactions = Array<Interaction>;
