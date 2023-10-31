import { AnnotateAction } from './annotate';
import { CategorizeAction } from './categorize';
import { ChangeColumnTypeAction } from './changeColumnType';
import { ChartCreationAction } from './create';
import { DropColumnsAction } from './dropColumn';
import { EditCellAction } from './editCell';
import { FilterAction } from './filter';
import { IntentSelectionAction } from './intentSelection';
import { RenameColumnAction } from './renameColumn';
import { ReorderColumnsAction } from './reorderColumns';
import { SelectionAction } from './selection';
import { SortByColumnAction } from './sortByColumn';

export type Interaction =
  | ChartCreationAction
  | SelectionAction
  | IntentSelectionAction
  | FilterAction
  | AnnotateAction
  | RenameColumnAction
  | DropColumnsAction
  | CategorizeAction
  | SortByColumnAction
  | ReorderColumnsAction
  | ChangeColumnTypeAction
  | EditCellAction;

export type Interactions = Array<Interaction>;
