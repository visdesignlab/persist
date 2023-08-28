import { CommandRegistry } from '@lumino/commands';
import {
  ActionIcon,
  Group,
  Popover,
  Stack,
  Tooltip,
  Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowsSort,
  IconArrowUp,
  IconArrowDown
} from '@tabler/icons-react';
import { useCallback, useMemo } from 'react';
import { TrrackableCell } from '../cells';
import { OutputCommandIds, SortCommandArgs } from '../cells/output/commands';
import { getDatasetFromVegaView } from '../vegaL/helpers';

type Props = {
  cell: TrrackableCell;
  commands: CommandRegistry;
};

export function SortPopup({ cell, commands }: Props) {
  const [opened, handlers] = useDisclosure(false);

  const sort = useCallback(
    (direction: 'ascending' | 'descending', col: string) => {
      const args: SortCommandArgs = {
        direction,
        col
      };
      commands.execute(OutputCommandIds.sort, args as any);
      handlers.close();
    },
    [commands, handlers]
  );

  const cols = useMemo(() => {
    if (!cell.vegaManager) {
      return { values: [], columns: [] };
    }
    return getDatasetFromVegaView(cell.vegaManager.view, cell.trrackManager);
  }, [cell.vegaManager]);

  return (
    <Popover
      opened={opened}
      onChange={handlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon onClick={handlers.toggle} variant={'subtle'}>
          <Tooltip.Floating label="Sort">
            <IconArrowsSort />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          {cols.values.length > 0
            ? Object.keys(cols.values[0]).map(k => {
                return (
                  <Group position="apart">
                    <Text>{k}</Text>
                    <Group>
                      <ActionIcon onClick={handlers.toggle} variant={'subtle'}>
                        <Tooltip.Floating label="Sort ascending">
                          <IconArrowUp onClick={() => sort('ascending', k)} />
                        </Tooltip.Floating>
                      </ActionIcon>
                      <ActionIcon onClick={handlers.toggle} variant={'subtle'}>
                        <Tooltip.Floating label="Sort descending">
                          <IconArrowDown
                            onClick={() => sort('descending', k)}
                          />
                        </Tooltip.Floating>
                      </ActionIcon>
                    </Group>
                  </Group>
                );
              })
            : null}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
