import { NodeId } from '@trrack/core';
import { Interactions } from '../../interactions/interaction';

export type GenerationRecord = {
  df_name: string;
  dynamic: boolean;
  root_id: string;
  current_node_id?: string;
  interactions?: Interactions;
};

export type GeneratedRecord = {
  [key: NodeId]: GenerationRecord;
};
