import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

export type Option = string;
export type Options = Option[];

export type Category = {
  name: string;
  options: Options;
  ordered: boolean;
};

export type Categories = Record<string, Category>;

// Action

type Operation<
  Op extends 'add' | 'remove' | 'reorder' | 'assign' =
    | 'add'
    | 'reorder'
    | 'remove'
    | 'assign'
> = Op extends 'add' | 'remove' | 'assign' | 'reorder'
  ? {
      op: Op;
    }
  : never;

type Scope<
  S extends 'category' | 'option' | 'options' =
    | 'category'
    | 'option'
    | 'options'
> = S extends 'category'
  ? {
      scope: S;
      category: string;
    }
  : S extends 'option'
    ? {
        scope: S;
        category: string;
        option: string;
      }
    : S extends 'options'
      ? { scope: S; category: string; option: string[] | boolean }
      : never;

type Combos =
  | (Operation<'add' | 'remove' | 'assign'> & Scope<'option'>)
  | (Operation<'add' | 'remove'> & Scope<'category'>)
  | (Operation<'reorder'> & Scope<'options'>);

export type CategoryAction = BaseInteraction & {
  type: 'category';
} & {
  action: Combos;
};

// Action Creator
export function createCategorizeActionAndLabelLike(
  action: Combos
): ActionAndLabelLike<CategoryAction> {
  return {
    action: {
      id: UUID(),
      type: 'category',
      action
    },
    label: () => {
      let label = '';

      switch (action.op) {
        case 'add':
          label += 'Add ';
          break;
        case 'remove':
          label += 'Remove ';
          break;
        case 'assign':
          label += 'Assign ';
          break;
        case 'reorder':
          label += `Reorder options for '${action.category}'`;
          break;
      }

      switch (action.scope) {
        case 'category':
          label += `new category '${action.category}'`;
          break;
        case 'option':
          if (action.op === 'assign') {
            label += `'${action.category} (${action.option})' to selected items.`;
          } else {
            label += `'${action.option}' ${
              action.op === 'add' ? 'to' : 'from'
            } ${action.category}`;
          }
          break;
      }

      return label;
    }
  };
}

// Command
export type CategorizeCommandArgs = BaseCommandArg & {
  action: Combos;
};

// Command Option
export const categorizeCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, action, overrideLabel } =
      castArgs<CategorizeCommandArgs>(args);

    const { action: act, label } = createCategorizeActionAndLabelLike(action);

    return cell.trrackManager.apply(act, overrideLabel ? overrideLabel : label);
  },
  label: 'Assign Category'
};
