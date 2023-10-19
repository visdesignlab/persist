import { AnnotateAction } from './annotate';
import { CategorizeAction } from './categorize';
import { ChartCreationAction } from './create';
import { DropColumnsAction } from './dropColumn';
import { FilterAction } from './filter';
import { RenameColumnAction } from './renameColumn';
import { ReorderColumnsAction } from './reorderColumns';
import { SelectionAction } from './selection';
import { SortByColumnAction } from './sortByColumn';
import { TypeChangeAction } from './typeChange';

export type Interaction =
  | ChartCreationAction
  | SelectionAction
  | FilterAction
  | AnnotateAction
  | RenameColumnAction
  | DropColumnsAction
  | CategorizeAction
  | SortByColumnAction
  | ReorderColumnsAction
  | TypeChangeAction;

export type Interactions = Array<Interaction>;
