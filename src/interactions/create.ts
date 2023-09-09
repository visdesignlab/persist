import { BaseInteraction } from './base';

export type ChartCreationAction = BaseInteraction & {
  id: string;
  type: 'create';
};
