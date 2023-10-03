import { AnnotateAction } from './annotate';
import { ChartCreationAction } from './create';
import { FilterAction } from './filter';
import { SelectionAction } from './selection';

export type Interaction =
  | ChartCreationAction
  | SelectionAction
  | FilterAction
  | AnnotateAction;

export type Interactions = Array<Interaction>;
