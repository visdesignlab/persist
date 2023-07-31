import {
  ActionIcon,
  Button,
  Center,
  Popover,
  Stack,
  TextInput,
  Tooltip
} from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';

export function CopyNamedDFPopup() {
  const [opened, setOpened] = useState(false);
  const [dfName, setDfName] = useInputState('');

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
              label="Create a named dataframe"
              placeholder="Enter valid python variable name"
              value={dfName}
              onChange={setDfName}
            />
            <Button>Create</Button>
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
