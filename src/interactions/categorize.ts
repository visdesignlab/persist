import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import { ActionAndLabelLike, BaseCommandArg, BaseInteraction } from './base';
import { castArgs } from '../utils/castArgs';

// Action
export type CategorizeAction = BaseInteraction & {
  type: 'categorize';
  category: string;
  option: string;
};

// Action Creator
export function createCategorizeActionAndLabelLike(
  category: string,
  option: string
): ActionAndLabelLike<CategorizeAction> {
  return {
    action: {
      id: UUID(),
      type: 'categorize',
      category,
      option
    },
    label: () => {
      return `Assign category ${category}`;
    }
  };
}

// Command
export type CategorizeCommandArgs = BaseCommandArg & {
  category: string;
  option: string;
};

// Command Option
export const categorizeCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { cell, category, option } = castArgs<CategorizeCommandArgs>(args);

    const { action, label } = createCategorizeActionAndLabelLike(
      category,
      option
    );

    return cell.trrackManager.apply(action, label);
  },
  label: 'Assign Category'
};
