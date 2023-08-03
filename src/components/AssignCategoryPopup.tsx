import { CommandRegistry } from '@lumino/commands';
import {
  ActionIcon,
  Button,
  Center,
  Divider,
  Popover,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCategory } from '@tabler/icons-react';
import { TrrackableCell } from '../cells';
import {
  CategorizeCommandArgs,
  OutputCommandIds
} from '../cells/output/commands';
import { useCategoryManager } from '../notebook/categories/manager';

type Props = {
  cell: TrrackableCell;
  commands: CommandRegistry;
};

export function AssignCategoryPopup({ commands }: Props) {
  const [opened, openHandlers] = useDisclosure();
  const cm = useCategoryManager();

  const activeCategory = cm.activeCategory();

  if (!activeCategory) {
    return null;
  }

  const categoryName = activeCategory.name;
  const categoryOptions = activeCategory
    ? Object.values(activeCategory.options)
    : null;

  const isEnabled = commands.isEnabled(OutputCommandIds.categorize);

  return (
    <Popover
      opened={opened}
      onChange={openHandlers.toggle}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon
          onClick={() => openHandlers.toggle()}
          variant={!isEnabled ? 'transparent' : 'subtle'}
          disabled={!isEnabled}
        >
          <Tooltip.Floating label="Assign Category" offset={20}>
            <IconCategory />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Center miw={300} mt="sm" mb="md">
          <Stack>
            <Text span size="lg">
              Select an option for category:{' '}
              <Text fw="bold" span>
                {categoryName}
              </Text>
            </Text>
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
                        category: activeCategory.name,
                        selectedOption: o.name
                      };

                      commands.execute(OutputCommandIds.categorize, args);
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
