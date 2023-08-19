import { NodeId } from '@trrack/core';
import { TrrackableCell, stringifyForCode } from '../cells';
import { Executor } from '../notebook';
import { Dataset } from '../vegaL/helpers';
import { Predictions } from './types';

export async function updatePredictions(
  cell: TrrackableCell,
  id: NodeId,
  selections: string[],
  data: Dataset,
  features: string[],
  row_label: string
) {
  let predictions: Predictions = [];

  try {
    cell.isLoadingPredictions.set(true);
    predictions = await getIntents(data, selections, features, row_label);
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
  selections: string[],
  features: string[],
  row_label: string
): Promise<Predictions> {
  const predictions: Predictions = [];

  const code = Executor.withIDE(`
PR.predict(${stringifyForCode(data.values)}, [${selections.join(
    ','
  )}], "${row_label}", ${stringifyForCode(features)});
`);

  console.log(code);

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
