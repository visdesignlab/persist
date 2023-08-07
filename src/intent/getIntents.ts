import { stringifyForCode } from '../cells';
import { Interactions } from '../interactions/types';
import { Executor } from '../notebook';
import { Predictions } from './types';

export async function getIntents(
  data: any[],
  interactions: Interactions
): Promise<Predictions> {
  const intents: Predictions = [];

  const code = Executor.withIDE(`
PR.predict(${stringifyForCode(data)}, ${stringifyForCode(interactions)});
`);

  const result = await Executor.execute(code);

  console.group('Intent');

  console.log(result);

  console.groupEnd();

  return Promise.resolve(intents);
}
