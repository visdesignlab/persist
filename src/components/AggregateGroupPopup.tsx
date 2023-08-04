import { CommandRegistry } from '@lumino/commands';
import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Stack,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { IconArrowMerge } from '@tabler/icons-react';
import { useCallback } from 'react';
import { TrrackableCell } from '../cells';
import {
  AggregateCommandArgs,
  OutputCommandIds
} from '../cells/output/commands';
import { AggregateOperation } from '../vegaL/spec/aggregate';

type Props = {
  cell: TrrackableCell;
  commands: CommandRegistry;
};

export function AggregateGroupPopup({ cell, commands }: Props) {
  const [opened, handlers] = useDisclosure(false);
  const [aggName, setAggName] = useInputState('');

  const aggregate = useCallback(
    (aggBy: AggregateOperation) => {
      const args: AggregateCommandArgs = {
        op: aggBy,
        aggregateName: aggName
      };
      commands.execute(OutputCommandIds.aggregate, args as any);
      setAggName('');
      handlers.close();
    },
    [aggName, commands, handlers]
  );

  return (
    <Popover
      opened={opened}
      onChange={handlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon
          onClick={handlers.toggle}
          disabled={!cell.trrackManager.hasSelections}
          variant={!cell.trrackManager.hasSelections ? 'transparent' : 'subtle'}
        >
          <Tooltip.Floating label="Aggregate selection">
            <IconArrowMerge />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          <Title order={4}>Create aggregate from selections</Title>
          <TextInput
            miw={300}
            placeholder="Enter name for the aggregate"
            value={aggName}
            onChange={setAggName}
          />
          <Group>
            <Button
              variant="outline"
              disabled={aggName.length === 0}
              onClick={() => aggregate('sum')}
            >
              Aggregate by Sum
            </Button>
            <Button
              variant="outline"
              disabled={aggName.length === 0}
              onClick={() => aggregate('mean')}
            >
              Aggregate by Mean
            </Button>
            <Button
              variant="outline"
              disabled={aggName.length === 0}
              onClick={() => aggregate('group')}
            >
              Group
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
