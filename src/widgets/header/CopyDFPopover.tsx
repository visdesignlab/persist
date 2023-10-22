import { Validation, validation } from '@hookstate/validation';

import { Signal } from '@lumino/signaling';
import React, { useEffect } from 'react';

import { useHookstate, useHookstateCallback } from '@hookstate/core';
import { NotebookActions } from '@jupyterlab/notebook';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Popover,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { IconCopy, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { TrrackableCell } from '../../cells';
import { isValidPythonVar } from '../utils/isValidPythonVar';

import { useModel, useModelState } from '@anywidget/react';
import { parseStringify } from '../../utils/jsonHelpers';
import { stripImmutableClone } from '../../utils/stripImmutableClone';
import { getInteractionsFromRoot } from '../trrack/utils';
import { GeneratedRecord, GenerationRecord } from '../utils/dataframe';

export const UPDATE = new Signal<any, string[]>({});

type Props = {
  cell: TrrackableCell;
};

export function CopyDFPopover({ cell }: Props) {
  const [opened, setOpened] = useState(false);

  const [groupByColumn, setGroupByColumn] = useState<string | null>('None');

  const [columns] = useModelState<string[]>('df_non_meta_columns');
  const [numericColumns] = useModelState<string[]>('df_numeric_columns');

  const [dataframeType, setDataframeType] = useToggle<'static' | 'dynamic'>([
    'static',
    'dynamic'
  ]);

  // Get model for listening
  const model = useModel();

  // Load from widget
  const [, setNodeDataframeMapModel] = useModelState<GeneratedRecord>(
    'generated_dataframe_record'
  );

  useEffect(() => {
    const unsub = cell.generatedDataframesState.subscribe(() => {
      setNodeDataframeMapModel(parseStringify(cell.generatedDataframes));
    });

    try {
      setNodeDataframeMapModel(
        stripImmutableClone(parseStringify(cell.generatedDataframesState.value))
      );
    } catch (e) {
      console.error(e);
    }

    return unsub;
  }, [cell]);

  const updateDataframeMapCb = useHookstateCallback(
    (record?: GenerationRecord) => {
      if (record) {
        cell.generatedDataframesState.nested(record.df_name).set(record);
      } else {
        cell.generatedDataframesState.set({});
      }
    },
    [cell]
  );

  // Track input name
  const dfName = useHookstate<string, Validation>('', validation());
  dfName.validate(isValidPythonVar, 'Not a valid python variable');
  dfName.validate(v => v.length > 0, 'Variable cannot be empty');

  return (
    <Button.Group>
      <Popover
        opened={opened}
        onChange={setOpened}
        withinPortal
        withArrow
        shadow="xl"
      >
        <Popover.Target>
          <ActionIcon onClick={() => setOpened(!opened)}>
            <Tooltip.Floating label="Create a named dataframe">
              <IconCopy />
            </Tooltip.Floating>
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Center miw={300} mt="sm" mb="md">
            <Stack>
              <TextInput
                miw={300}
                error={!dfName.valid()}
                label="Create a named dataframe"
                rightSection={
                  dataframeType === 'dynamic' && <Text c="dimmed">_dyn</Text>
                }
                placeholder="Enter valid python variable name"
                value={dfName.value}
                onChange={e => {
                  const name = e.currentTarget.value;
                  dfName.set(name);
                }}
              />
              {!dfName.valid() && dfName.value.length > 0 && (
                <Text size="sm" mt="md">
                  {dfName.value} is not a valid python variable name.
                </Text>
              )}
              <Box>
                <Switch
                  size="md"
                  checked={dataframeType === 'dynamic'}
                  onChange={e =>
                    setDataframeType(
                      e.currentTarget.checked ? 'dynamic' : 'static'
                    )
                  }
                  description="Dynamic dataframes follow the current node"
                  label="Create dynamic dataframe"
                />
              </Box>
              <Divider />
              <Box>
                <Select
                  data={['None', ...columns].map(c => ({ label: c, value: c }))}
                  value={groupByColumn}
                  onChange={setGroupByColumn}
                  placeholder="Select a column to group the dataset by."
                  searchable
                  label="Group By:"
                />
              </Box>
              <Group>
                <Button
                  disabled={!dfName.valid()}
                  onClick={async () => {
                    const isDynamic = dataframeType === 'dynamic';
                    const isGrouped = groupByColumn && groupByColumn !== 'None';
                    const trrack = cell.trrackManager.trrack;
                    let name = isDynamic ? dfName.value + '_dyn' : dfName.value;

                    name = isGrouped ? name + '_grouped' : name;

                    const record: GenerationRecord = {
                      df_name: name,
                      dynamic: isDynamic,
                      root_id: trrack.root.id,
                      current_node_id: isDynamic
                        ? undefined
                        : trrack.current.id,
                      interactions: isDynamic
                        ? []
                        : getInteractionsFromRoot(trrack)
                    };

                    if (isGrouped) {
                      record.groupby = groupByColumn;
                    }

                    async function _notify(msg: DFGenerationMessage) {
                      model.off('msg:custom', _notify);

                      return _notifyDfCreation(
                        msg,
                        name,
                        _copyCb,
                        numericColumns
                      );
                    }
                    model.on('msg:custom', _notify);

                    updateDataframeMapCb(record);

                    setOpened(false);
                    setTimeout(() => {
                      dfName.set('');
                    }, 100);
                  }}
                >
                  Create & Copy
                </Button>
                <Button
                  disabled={!dfName.valid()}
                  onClick={async () => {
                    const isDynamic = dataframeType === 'dynamic';
                    const isGrouped = groupByColumn && groupByColumn !== 'None';
                    const trrack = cell.trrackManager.trrack;
                    let name = isDynamic ? dfName.value + '_dyn' : dfName.value;

                    name = isGrouped ? name + '_grouped' : name;

                    const record: GenerationRecord = {
                      df_name: name,
                      dynamic: isDynamic,
                      root_id: trrack.root.id,
                      current_node_id: isDynamic
                        ? undefined
                        : trrack.current.id,
                      interactions: isDynamic
                        ? []
                        : getInteractionsFromRoot(trrack)
                    };

                    if (isGrouped) {
                      record.groupby = groupByColumn;
                    }

                    async function _notify(msg: DFGenerationMessage) {
                      model.off('msg:custom', _notify);

                      return _notifyDfCreation(
                        msg,
                        name,
                        _insertCellCb,
                        numericColumns
                      );
                    }
                    model.on('msg:custom', _notify);

                    updateDataframeMapCb(record);

                    setOpened(false);
                    setTimeout(() => {
                      dfName.set('');
                    }, 100);
                  }}
                >
                  Create & Insert Cell
                </Button>
              </Group>
            </Stack>
          </Center>
        </Popover.Dropdown>
      </Popover>
      <ActionIcon
        onClick={() => {
          updateDataframeMapCb();
        }}
      >
        <Tooltip.Floating label="Delete all datasets">
          <IconTrash />
        </Tooltip.Floating>
      </ActionIcon>
    </Button.Group>
  );
}
export async function copyDFNameToClipboard(name: string) {
  return await navigator.clipboard.writeText(name);
}

export function notifyCopySuccess(dfName: string) {
  window.Persist.Notification.notify(
    `Copied code for df: ${dfName}`,
    'success',
    {
      autoClose: 500
    }
  );
}

export function addCellWithDataframeVariable(dfName: string) {
  const currentNotebook = window.Persist.Notebook.nbPanel?.content;
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
    window.Persist.Notebook.nbPanel?.sessionContext
  );
}

type DFGenerationMessage = {
  msg: Array<{
    type: 'df-created';
    name: string;
    groupby?: string;
  }>;
  error: Array<any>;
};

async function _copyCb(dfCode: string, name: string) {
  await copyDFNameToClipboard(dfCode);
  notifyCopySuccess(name);
}

async function _insertCellCb(dfCode: string, _name: string) {
  return addCellWithDataframeVariable(dfCode);
}

async function _notifyDfCreation(
  { msg, error }: DFGenerationMessage,
  dfName: string,
  notifyCb: (dfCode: string, dfName: string) => Promise<void>,
  columns: string[] = []
) {
  for (let i = 0; i < msg.length; ++i) {
    const m = msg[i];

    if (m.name !== dfName) {
      continue;
    }

    if (m.type === 'df-created') {
      const name = m.name;

      const aggString =
        columns.length === 0
          ? 'mean'
          : `{${columns.map(c => `"${c}": "mean"`).join(', ')}}`;

      const dfGenerationString = m.groupby
        ? `${name} = PR.df.get("${name}", groupby="${m.groupby}", aggregate=${aggString})\n${name}`
        : `${name} = PR.df.get("${name}")\n${name}`;

      await notifyCb(dfGenerationString, name);
    }
  }

  if (error.length > 0) {
    console.log(error);
  }
}
