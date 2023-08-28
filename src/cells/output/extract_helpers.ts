import { Notification } from '@jupyterlab/apputils';
import { NotebookActions } from '@jupyterlab/notebook';
import { NodeId } from '@trrack/core';
import { varName } from 'vega-lite';
import { ROW_ID } from '../../interactions/apply';
import { getInteractionsFromRoot } from '../../interactions/helpers';
import { Interactions } from '../../interactions/types';
import { Executor } from '../../notebook';
import { IDEGlobal, Nullable } from '../../utils';
import { TrrackableCell } from '../trrackableCell';

type DataframeBase = {
  name: string;
};

export type NodeDataframe = DataframeBase & {
  nodeId: NodeId;
};

export type NodeDataframeMap = {
  [key: string]: Nullable<NodeDataframe>;
};

export type GraphDataframe = DataframeBase & {
  graphId: NodeId;
};

export type GeneratedDataframes = {
  nodeDataframes: NodeDataframeMap;
  graphDataframes: Nullable<GraphDataframe>;
};

export const defaultGenerateDataframes = {
  nodeDataframes: {},
  graphDataframes: null
};

export async function extractDfAndCopyName(
  cell: TrrackableCell,
  nodeId: NodeId,
  dfName: string,
  copy = true
) {
  await extractDataframe(cell, nodeId, dfName);

  if (copy) {
    await copyDFNameToClipboard(dfName);
    notifyCopySuccess(dfName);
  }

  return dfName;
}

export async function extractDataframe(
  cell: TrrackableCell,
  nodeId: NodeId,
  dfName: string
) {
  const interactions = getInteractionsFromRoot(cell.trrackManager, nodeId);

  if (cell.data.length > 0) {
    const data: any[] = cell.originalData || [];

    const result = await Executor.execute(
      createDataframeCode(dfName, data, interactions)
    );
    return { result, dfName };
  }

  const vega = cell.vegaManager;

  if (!vega) {
    throw new Error('Vega view not found');
  }

  const state = vega.view.getState({
    data: d => !!d && (d.startsWith('source_') || d.startsWith('data-')),
    signals: () => false
  });

  const sourceDatasetNames = Object.keys(state.data);
  if (sourceDatasetNames.length !== 1) {
    throw new Error('incorrect dataset. start with source_ or is data_0');
  }

  const data: any[] = Object.values(state.data[sourceDatasetNames[0]]);

  const result = await Executor.execute(
    createDataframeCode(dfName, data, interactions)
  );

  // console.log({ result, dfName });

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
  const code = Executor.withIDE(
    `
${dfName} = PR.apply(${stringifyForCode(data)}, ${stringifyForCode(
      interactions
    )}, "${ROW_ID}")
print(${dfName})
${dfName}
`
  );

  return code;
}

export function getDataframeCode(
  dfName: string,
  data: any[],
  interactions: Interactions
) {
  const code = Executor.withIDE(
    `
PR.get_dataframe(${stringifyForCode(data)}, ${stringifyForCode(interactions)})

`
  );

  return code;
}

export function stringifyForCode(obj: any) {
  return JSON.stringify(JSON.stringify(obj));
}

export function addCellWithDataframeVariable(dfName: string) {
  const currentNotebook = IDEGlobal.currentNotebook?.content;
  if (!currentNotebook) {
    return;
  }
  NotebookActions.insertBelow(currentNotebook);

  const newCell = currentNotebook.activeCell;

  if (!newCell) {
    return;
  }

  const text = newCell.model.sharedModel.getSource();

  if (text.length > 0) {
    throw new Error('New codecell should have no content!');
  }

  newCell.model.sharedModel.setSource(dfName);

  NotebookActions.run(
    currentNotebook,
    IDEGlobal.currentNotebook?.sessionContext
  );
}
