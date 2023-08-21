import { Validation, validation } from '@hookstate/validation';
import { CommandRegistry } from '@lumino/commands';

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
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import {
  TrrackableCell,
  extractDataframe,
  extractDfAndCopyName
} from '../cells';
import { isValidPythonVar } from '../utils/isValidPythonVar';

type Props = {
  cell: TrrackableCell;
  commands: CommandRegistry;
};

export function CopyDFPopup({ cell }: Props) {
  const [opened, setOpened] = useState(true);
  const [dataframeType, setDataframeType] = useToggle<'static' | 'dynamic'>([
    'static',
    'dynamic'
  ]);

  const nodeDataframes = useHookstate(cell.generatedDataframes.nodeDataframes);
  const graphDataframe = useHookstate(cell.generatedDataframes.graphDataframes);
  const currentNode = useHookstate(cell.trrackManager.currentState);

  const currentNodeDataframe = nodeDataframes.nested(currentNode.value);

  const dfName = useHookstate<string, Validation>(
    (dataframeType === 'static'
      ? currentNodeDataframe.ornull?.name.value
      : graphDataframe.value?.name) || '',
    validation()
  );

  dfName.validate(isValidPythonVar, 'Not a valid python variable');
  dfName.validate(v => v.length > 0, 'Variable cannot be empty');

  return (
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
              placeholder="Enter valid python variable name"
              value={dfName.value}
              onChange={e =>
                dfName.set(
                  dataframeType === 'static'
                    ? e.currentTarget.value
                    : `${e.currentTarget.value}_dyn`
                )
              }
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
                  if (dataframeType === 'static') {
                    const name = await extractDfAndCopyName(
                      cell,
                      cell.trrackManager.current,
                      dfName.value
                    );
                    currentNodeDataframe.set({
                      name,
                      nodeId: currentNode.value
                    });
                  } else {
                    const { dfName: name } = await extractDataframe(
                      cell,
                      cell.trrackManager.current,
                      dfName.value
                    );
                    graphDataframe.set({
                      name,
                      graphId: cell.trrackManager.root
                    });
                  }

                  setOpened(false);
                }}
              >
                Create & Copy
              </Button>
              <Button
                disabled={!dfName.valid()}
                onClick={async () => {
                  // await extractDataframe(
                  //   cell,
                  //   cell.trrackManager.current,
                  //   dfName.value,
                  // );
                  // addCellWithDataframeVariable(dfName.value);
                  // setOpened(false);
                }}
              >
                Create & Insert Cell
              </Button>
            </Group>
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
