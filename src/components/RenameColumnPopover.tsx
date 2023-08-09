import { ActionIcon, Popover, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit } from '@tabler/icons-react';
import { TrrackableCell } from '../cells';

type Props = {
  cell: TrrackableCell;
};

export function RenameColumnPopover({ cell }: Props) {
  const [opened, openHandlers] = useDisclosure();
  cell;

  return (
    <Popover
      opened={opened}
      onChange={openHandlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon onClick={() => openHandlers.toggle()}>
          <Tooltip.Floating label="Rename Column" offset={20}>
            <IconEdit />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>Rename</Popover.Dropdown>
    </Popover>
  );
}
