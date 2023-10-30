import React from 'react';
import {
  Button,
  Center,
  Divider,
  Popover,
  Stack,
  Text,
  Title,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCategory } from '@tabler/icons-react';
import { TrrackableCell } from '../../cells';
import { useCategoryManager } from '../../notebook';
import { PersistCommands } from '../../commands';
import { CategorizeCommandArgs } from '../../interactions/categorize';
import { HeaderActionIcon } from './StyledActionIcon';

type Props = {
  cell: TrrackableCell;
};

export function AssignCategoryPopover({ cell }: Props) {
  const [opened, openHandlers] = useDisclosure(false);
  const cm = useCategoryManager();

  const activeCategory = cm.activeCategory();

  if (!activeCategory) {
    return null;
  }

  const categoryName = activeCategory.name;
  const categoryOptions = activeCategory
    ? Object.values(activeCategory.options)
    : null;

  const isEnabled = window.Persist.Commands.registry.isEnabled(
    PersistCommands.categorize
  );

  return (
    <Popover
      opened={opened}
      onChange={openHandlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <HeaderActionIcon
          onClick={() => openHandlers.toggle()}
          variant={!isEnabled ? 'transparent' : 'subtle'}
          disabled={!isEnabled}
        >
          <Tooltip.Floating label="Assign Category" offset={20}>
            <IconCategory />
          </Tooltip.Floating>
        </HeaderActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Center mt="sm" mb="md">
          <Stack>
            <Title size="lg">
              Select an option for category:{' '}
              <Text fw="bold" span>
                {categoryName}
              </Text>
            </Title>
            <Divider />
            {categoryOptions && categoryOptions.length > 0 ? (
              <Button.Group orientation="vertical">
                {categoryOptions.map(o => (
                  <Button
                    variant="subtle"
                    size="xs"
                    key={o.name}
                    onClick={() => {
                      const args: CategorizeCommandArgs = {
                        cell,
                        category: activeCategory.name,
                        option: o.name
                      };

                      window.Persist.Commands.execute(
                        PersistCommands.categorize,
                        args
                      );

                      openHandlers.close();
                    }}
                  >
                    {o.name}
                  </Button>
                ))}
              </Button.Group>
            ) : (
              <Text c="dimmed">
                Please add options for category: {categoryName}
              </Text>
            )}
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
