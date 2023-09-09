import { ChartCreationAction } from './create';
import { SelectionAction } from './selection';

export type Interaction = ChartCreationAction | SelectionAction;

export type Interactions = Array<Interaction>;
