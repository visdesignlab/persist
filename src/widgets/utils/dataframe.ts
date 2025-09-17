import { Interactions } from '../../interactions/interaction';

import { CommandRegistry } from '@lumino/commands';
import { BaseCommandArg } from '../../interactions/base';
import { castArgs } from '../../utils/castArgs';
import { AnyModel } from '@anywidget/types';
import { PersistCommandRegistry, PersistCommands } from '../../commands';
import { TrrackProvenance } from '../trrack/types';
import { getInteractionsFromRoot } from '../trrack/utils';

export type GenerationRecord = {
  dfName: string;
  root_id?: string;
  current_node_id?: string;
  interactions: Interactions;
  isDynamic: boolean;
};

export type GeneratedRecord = {
  [key: string]: GenerationRecord;
};

// Command
export type CreateOrDeleteDataframeCommandArgs = BaseCommandArg & {
  record: GenerationRecord;
  model: AnyModel;
  post?: 'copy' | 'insert';
};

export type PostDataframeGenerationCommandArg = {
  record: GenerationRecord;
};

export type DFGenerationMessage = {
  msg: {
    type: 'df_created';
    record: GenerationRecord;
    post?: 'copy' | 'insert';
  };
};

// Command Option
export const createDataframeCommandOption: CommandRegistry.ICommandOptions = {
  execute(args) {
    const { record, model, post } =
      castArgs<CreateOrDeleteDataframeCommandArgs>(args);

    model.set('gdr_signal', {
      record,
      post
    });
    model.save_changes();
  }
};

export const deleteGeneratedDataframeCommandOption: CommandRegistry.ICommandOptions =
  {
    execute(args) {
      const { cell } = castArgs<CreateOrDeleteDataframeCommandArgs>(args);

      cell;
    },
    label: 'Delete generated dataframe'
  };

export const copyGeneratedDataframeCommandOption: CommandRegistry.ICommandOptions =
  {
    execute(args) {
      const { record } = castArgs<PostDataframeGenerationCommandArg>(args);

      copyDFNameToClipboard(record.dfName)
        .then(() => {
          // TODO: Add a notification
          console.log('Copied to clipboard');
        })
        .catch(err => {
          console.error(err);
        });
    }
  };

export function postCreationAction(record: GenerationRecord, copy?: boolean) {
  if (copy) {
    PersistCommandRegistry.instance.execute(PersistCommands.copyDataframe, {
      record
    });
  }
}

async function copyDFNameToClipboard(name: string) {
  return await navigator.clipboard.writeText(name);
}

export function getRecord(
  dfName: string,
  trrack: TrrackProvenance,
  isDynamic: boolean
): GenerationRecord {
  return {
    dfName,
    root_id: trrack.root.id,
    current_node_id: trrack.current.id,
    interactions: getInteractionsFromRoot(trrack),
    isDynamic
  };
}
