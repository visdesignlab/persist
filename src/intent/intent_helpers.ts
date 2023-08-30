import { Notification } from '@jupyterlab/apputils';
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

  if (cell.trrackManager.current !== id) {
    return;
  }

  cell.predictionsCache.set(id, predictions);
  cell.predictions.set(predictions.slice(0, 10));
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

  const result = await Executor.execute(code);

  if (result.status === 'ok') {
    predictions.push(...result.result);
  } else {
    console.error(result.err);
  }

  return Promise.resolve(predictions);
}

export function notifyPredictions(
  success: boolean,
  countOrError: number | string,
  autoClose = 500
): void {
  let message = '';

  if (success) {
    message = `${countOrError} predictions are ready!`;
  } else if (typeof countOrError === 'string' && countOrError.length > 0) {
    message = countOrError;
  }
  Notification.emit(message, 'success', {
    autoClose
  });
}
