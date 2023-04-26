import { Interaction } from '../../interactions/types';

export type SelectionInitIDEMixin<T extends Interaction> = {
  __ide__: T;
};
