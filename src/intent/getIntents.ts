import { NodeId } from '@trrack/core';
import { TrrackableCell, stringifyForCode } from '../cells';
import { Executor } from '../notebook';
import { Dataset } from '../vegaL/helpers';
import { Predictions } from './types';

export async function updatePredictions(
  cell: TrrackableCell,
  id: NodeId,
  selections: number[],
  data: Dataset,
  features: string[]
) {
  let predictions: Predictions = [];

  try {
    cell.isLoadingPredictions.set(true);
    predictions = await getIntents(data, selections, features);
  } catch (err) {
    console.error(err);
    predictions = [];
  } finally {
    cell.isLoadingPredictions.set(false);
  }

  cell.predictionsCache.set(id, predictions);

  return predictions;
}

export async function getIntents(
  data: Dataset,
  selections: number[],
  features: string[]
): Promise<Predictions> {
  const predictions: Predictions = [];

  const code = Executor.withIDE(`
PR.predict(${stringifyForCode(data.values)}, ${stringifyForCode(
    selections
  )}, ${stringifyForCode(features)});
`);

  const result = await Executor.execute(code);

  if (result.status === 'ok') {
    const content = result.content;

    console.log(content);

    const parsedString = content[0].substring(1, content[0].length - 1);

    const preds: Predictions = Object.values(JSON.parse(parsedString));
    predictions.push(...preds);
  } else {
    console.error(result.err);
  }

  return Promise.resolve(predictions);
}
