import { Interaction } from '../interactions/types';

// TODO: Consider removing
type UserMeta = {
  interactions: Record<string, Interaction>;
  sequence: string[];
};

export function isUserMeta(meta: unknown): meta is UserMeta {
  const _m = meta as any;
  return 'interactions' in _m && 'sequence' in _m;
}
