import { stringifyForCode } from '../cells';
import { Interactions } from '../interactions/types';
import { Executor } from '../notebook';
import { Dataset } from '../vegaL/helpers';
import { Predictions } from './types';

export async function getIntents(
  data: Dataset,
  interactions: Interactions
): Promise<Predictions> {
  const predictions: Predictions = [];

  const code = Executor.withIDE(`
PR.predict(${stringifyForCode(data.values)}, ${stringifyForCode(interactions)});
`);

  const result = await Executor.execute(code);

  console.log(result);

  if (result.status === 'ok') {
    const content = result.content;

    const parsedString = content[0].substring(1, content[0].length - 1);

    const preds: Predictions = Object.values(JSON.parse(parsedString));
    predictions.push(...preds);
  } else {
    console.error(result.err);
    throw new Error(result.err);
  }

  return Promise.resolve(predictions);
}
