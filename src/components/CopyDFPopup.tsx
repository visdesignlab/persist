import { CommandRegistry } from '@lumino/commands';
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
import { useToggle, useValidatedState } from '@mantine/hooks';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import {
  TrrackableCell,
  addCellWithDataframeVariable,
  extractDfAndCopyName
} from '../cells';
import { isValidPythonVar } from '../utils/isValidPythonVar';

type Props = {
  cell: TrrackableCell;
  commands: CommandRegistry;
};

export function CopyDFPopup({ cell }: Props) {
  const [opened, setOpened] = useState(false);
  const [dataframeType, setDataframeType] = useToggle<'static' | 'dynamic'>([
    'static',
    'dynamic'
  ]);

  const trrack = cell.trrackManager;
  const varName = trrack.getVariableNameFromNodeMetadata() || '';

  const [dfName, setDfName] = useValidatedState<string>(
    varName,
    val => isValidPythonVar(val),
    true
  );

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
            <Box>
              <Switch
                checked={dataframeType === 'dynamic'}
                onChange={e =>
                  setDataframeType(
                    e.currentTarget.checked ? 'dynamic' : 'static'
                  )
                }
                disabled={true}
                description="Disabled for now."
                label="Dynamic"
              />
            </Box>
            <TextInput
              miw={300}
              error={!dfName.valid}
              label="Create a named dataframe"
              placeholder="Enter valid python variable name"
              value={dfName.value}
              onChange={e => setDfName(e.currentTarget.value)}
            />
            {!dfName.valid && dfName.value.length > 0 && (
              <Text size="sm" mt="md">
                {dfName.value} is not a valid python variable name.
              </Text>
            )}
            <Group>
              <Button
                disabled={
                  !dfName.valid ||
                  dfName.value.length === 0 ||
                  dfName.value === varName
                }
                onClick={async () => {
                  trrack.saveVariableNameToNodeMetadata(dfName.value);
                  await extractDfAndCopyName(
                    cell,
                    cell.trrackManager.current,
                    dfName.value
                  );
                  setOpened(false);
                }}
              >
                Create & Copy
              </Button>
              <Button
                disabled={
                  !dfName.valid ||
                  dfName.value.length === 0 ||
                  dfName.value === varName
                }
                onClick={async () => {
                  trrack.saveVariableNameToNodeMetadata(dfName.value);
                  await extractDfAndCopyName(
                    cell,
                    cell.trrackManager.current,
                    dfName.value,
                    false
                  );
                  addCellWithDataframeVariable(dfName.value);
                  setOpened(false);
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
