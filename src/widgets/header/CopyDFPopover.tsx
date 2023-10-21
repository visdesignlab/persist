import { Validation, validation } from '@hookstate/validation';
import { Signal } from '@lumino/signaling';
import React, { useEffect } from 'react';

import { useHookstate, useHookstateCallback } from '@hookstate/core';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Popover,
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
import { NotebookActions } from '@jupyterlab/notebook';
import { Notification } from '@jupyterlab/apputils';
import { useModel, useModelState } from '@anywidget/react';
import { GeneratedRecord, GenerationRecord } from '../utils/dataframe';
import { parseStringify } from '../../utils/jsonHelpers';
import { stripImmutableClone } from '../../utils/stripImmutableClone';
import { getInteractionsFromRoot } from '../trrack/utils';

export const UPDATE = new Signal<any, string[]>({});

type Props = {
  cell: TrrackableCell;
};

export function CopyDFPopover({ cell }: Props) {
  const [opened, setOpened] = useState(false);

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

    setNodeDataframeMapModel(
      stripImmutableClone(parseStringify(cell.generatedDataframesState.value))
    );

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
              <Group>
                <Button
                  disabled={!dfName.valid()}
                  onClick={async () => {
                    const isDynamic = dataframeType === 'dynamic';
                    const trrack = cell.trrackManager.trrack;

                    const record: GenerationRecord = {
                      df_name: isDynamic ? dfName.value + '_dyn' : dfName.value,
                      dynamic: isDynamic,
                      root_id: trrack.root.id,
                      current_node_id: isDynamic
                        ? undefined
                        : trrack.current.id,
                      interactions: isDynamic
                        ? []
                        : getInteractionsFromRoot(trrack)
                    };

                    function _notify(msg: any) {
                      model.off('msg:custom', _notify);

                      console.log('Hello', msg);
                    }
                    model.on('msg:custom', _notify);

                    updateDataframeMapCb(record);

                    dfName.set('');
                    setOpened(false);
                  }}
                >
                  Create & Copy
                </Button>
                <Button
                  disabled={!dfName.valid()}
                  onClick={async () => {
                    //
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
  Notification.emit(`Copied code for df: ${dfName}`, 'success', {
    autoClose: 500
  });
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
