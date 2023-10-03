import { CommandRegistry } from '@lumino/commands';
import { UUID } from '../utils/uuid';
import {
  ActionAndLabelLike,
  BaseCommandArg,
  BaseInteraction,
  hasSelections
} from './base';
import { castArgs } from '../utils/castArgs';

export type Annotation = {
  type: 'annotate';
  createdOn: number;
  text: string;
};

// Action
export type AnnotateAction = BaseInteraction & Annotation;

export function createAnnotateActionAndLabelLike(
  text: string
): ActionAndLabelLike<AnnotateAction> {
  return {
    action: {
      id: UUID(),
      type: 'annotate',
      text,
      createdOn: Date.now()
    },
    label: 'Add annotation'
  };
}

// Command
export type AnnotateCommandArgs = BaseCommandArg & {
  text: string;
};

export const annotateCommandOption: CommandRegistry.ICommandOptions = {
  isEnabled(args) {
    return hasSelections(args);
  },
  execute(args) {
    const { cell, text } = castArgs<AnnotateCommandArgs>(args);

    const actions = cell.trrackActions;

    if (!actions) {
      return;
    }

    const { action, label } = createAnnotateActionAndLabelLike(text);

    return actions.annotate(action, label);
  }
};
