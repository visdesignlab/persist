import { Validation, validation } from '@hookstate/validation';
import React from 'react';

import { useHookstate } from '@hookstate/core';
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

type Props = {
  cell: TrrackableCell;
};

export function CopyDFPopover({ cell }: Props) {
  const [opened, setOpened] = useState(false);
  const [dataframeType, setDataframeType] = useToggle<'static' | 'dynamic'>([
    'static',
    'dynamic'
  ]);

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
                    const currentNode = cell.trrackManager.trrack.current.id;

                    if (dataframeType === 'static') {
                      cell.generatedDataframes.staticDataframes.set(c => ({
                        ...c,
                        [currentNode]: dfName.value
                      }));
                    } else {
                      cell.generatedDataframes.dynamicDataframes.set(
                        dfName.value + '_dyn'
                      );
                    }

                    setOpened(false);
                    dfName.set('');
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
          //
        }}
      >
        <Tooltip.Floating label="Delete all datasets">
          <IconTrash />
        </Tooltip.Floating>
      </ActionIcon>
    </Button.Group>
  );
}
