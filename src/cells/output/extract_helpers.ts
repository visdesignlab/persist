import { Notification } from '@jupyterlab/apputils';
import { NodeId } from '@trrack/core';
import { varName } from 'vega-lite';
import { getInteractionsFromRoot } from '../../interactions/helpers';
import { Interactions } from '../../interactions/types';
import { Executor } from '../../notebook';
import { IDEGlobal } from '../../utils';
import { TrrackableCell } from '../trrackableCell';

export async function extractDfAndCopyName(cell: TrrackableCell, tId?: NodeId) {
  const { result, dfName } = await extractDataframe(cell, tId);

  await copyDFNameToClipboard(dfName);
  notifyCopySuccess(dfName);

  return result;
}

export async function extractDataframe(cell: TrrackableCell, tId?: NodeId) {
  const trrack = cell.trrackManager.trrack;

  const vega = IDEGlobal.vegaManager.get(cell);

  if (!vega) {
    throw new Error('Vega view not found');
  }

  const trrackId = tId ? tId : trrack.root.id;

  const interactions = getInteractionsFromRoot(
    cell.trrackManager,
    tId || trrack.current.id
  );

  const state = vega.view.getState({
    data: d => !!d && (d.startsWith('source_') || d === 'data_0'),
    signals: () => false
  });

  const sourceDatasetNames = Object.keys(state.data);
  if (sourceDatasetNames.length !== 1) {
    throw new Error('incorrect dataset. start with source_ or is data_0');
  }

  const data: any[] = state.data[sourceDatasetNames[0]];

  const dfName = createDataframeVariableName(trrackId.substring(0, 5), {
    prefix: 'df',
    suffix: tId ? '' : 'dyn'
  });

  const result = await Executor.execute(
    createDataframeCode(dfName, data, interactions)
  );

  console.log(result);

  return { result, dfName };
}

export function notifyCopySuccess(dfName: string) {
  Notification.emit(`Copied code for df: ${dfName}`, 'success', {
    autoClose: 500
  });
}

export async function copyDFNameToClipboard(name: string) {
  return await navigator.clipboard.writeText(name);
}

export function createDataframeVariableName(
  name: string,
  opts?: { prefix?: string; suffix?: string }
) {
  const { prefix = '', suffix = '' } = opts || {};

  return varName([prefix, name, suffix].join(' ').trim());
}

export function createDataframeCode(
  dfName: string,
  data: any[],
  interactions: Interactions
) {
  console.log({
    data: stringifyForCode(data),
    interactions: stringifyForCode(interactions)
  });

  const code = Executor.withIDE(
    `
${dfName} = PR.apply(${stringifyForCode(data)}, ${stringifyForCode(
      interactions
    )})
print(${dfName})
${dfName}
`
  );

  return code;
}

export function stringifyForCode(obj: any) {
  return JSON.stringify(JSON.stringify(obj));
}
