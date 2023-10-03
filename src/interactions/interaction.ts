import { AnnotateAction } from './annotate';
import { ChartCreationAction } from './create';
import { FilterAction } from './filter';
import { RenameColumnAction } from './renameColumn';
import { SelectionAction } from './selection';

export type Interaction =
  | ChartCreationAction
  | SelectionAction
  | FilterAction
  | AnnotateAction
  | RenameColumnAction;

export type Interactions = Array<Interaction>;
