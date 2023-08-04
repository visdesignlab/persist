import {
  ActionIcon,
  Button,
  Center,
  Popover,
  Stack,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { useValidatedState } from '@mantine/hooks';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { TrrackableCell, extractDfAndCopyName } from '../cells';
import { isValidPythonVar } from '../utils/isValidPythonVar';

type Props = {
  cell: TrrackableCell;
};

export function CopyNamedDFPopup({ cell }: Props) {
  const [opened, setOpened] = useState(false);

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
            <Button
              disabled={
                !dfName.valid ||
                dfName.value.length === 0 ||
                dfName.value === varName
              }
              onClick={() => {
                trrack.saveVariableNameToNodeMetadata(dfName.value);
                extractDfAndCopyName(
                  cell,
                  cell.trrackManager.current,
                  dfName.value
                );
              }}
            >
              Create
            </Button>
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
