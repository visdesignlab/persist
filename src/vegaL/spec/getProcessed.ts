import { stringifyForCode } from '../../cells';
import { ROW_ID } from '../../interactions/apply';
import { Interactions } from '../../interactions/types';
import { Executor } from '../../notebook';
import { Dataset } from '../helpers';

export type ProcessedResult = {
  processed: Array<string>;
  selected: Array<string>;
};

export async function getProcessed(
  data: Dataset['values'],
  interactions: Interactions,
  rowLabel = ROW_ID
): Promise<ProcessedResult[]> {
  const code = Executor.withIDE(`
PR.get_pts_status(${stringifyForCode(data)}, ${stringifyForCode(
    interactions
  )}, "${rowLabel}")
`);

  const execResult = await Executor.execute(code);

  if (execResult.status === 'ok') {
    return Promise.resolve(execResult.result as ProcessedResult[]);
  } else {
    console.log(execResult.err);
    console.error(execResult.err);
    throw new Error(execResult.err);
  }
}
