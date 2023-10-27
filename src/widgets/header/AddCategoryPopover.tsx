import React from 'react';
import {
  Center,
  ActionIcon,
  Divider,
  Group,
  Popover,
  Stack,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core';
import { useDisclosure, useInputState } from '@mantine/hooks';
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { useCallback } from 'react';
import { TrrackableCell } from '../../cells';
import { useCategoryManager } from '../../notebook';
import { Options } from '../../interactions/categories';
import { SelectCreatable } from './CreatableSelect';
import { HeaderActionIcon } from './StyledActionIcon';

type Props = {
  cell: TrrackableCell;
};

export function AddCategoryPopover({ cell }: Props) {
  const [opened, openHandlers] = useDisclosure();
  const [newOption, setNewOption] = useInputState<string>('');
  const cm = useCategoryManager();
  const activeCategory = cm.activeCategory();

  const addCategory = useCallback(
    (
      name: string,
      options: Options = {
        _None: {
          name: 'None'
        }
      }
    ) => {
      const category = cm.addCategory(name, options);
      return { ...category, label: name, value: name };
    },
    [cm]
  );

  const removeCategory = useCallback(() => {
    if (!activeCategory) {
      return;
    }
    cm.removeCategory(activeCategory.name);
  }, [cm, activeCategory]);

  const changeActiveCategory = useCallback(
    (category: string) => {
      cm.changeActiveCategory(category);
    },
    [cm]
  );

  const addCategoryOption = useCallback(() => {
    if (!activeCategory || newOption.length === 0) {
      return;
    }

    cm.addCategoryOption(activeCategory.name, {
      name: newOption
    });
    setNewOption('');
  }, [cell, activeCategory, newOption]);

  const removeCategoryOption = useCallback(
    (option: string) => {
      if (!activeCategory) {
        return;
      }

      cm.removeCategoryOption(activeCategory.name, option);
    },
    [activeCategory]
  );

  const categoryOptions =
    activeCategory && Object.values(activeCategory.options);

  const categoryList = cm.categoriesList().map(c => ({
    ...c,
    value: c.name,
    label: c.name
  }));

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
          variant="subtle"
          onClick={() => openHandlers.toggle()}
        >
          <Tooltip.Floating label="Edit categories" offset={20}>
            <IconPlus />
          </Tooltip.Floating>
        </HeaderActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Center miw={300} mt="sm" mb="md">
          <Stack>
            <Title order={3}>Active Category</Title>
            <Group>
              <SelectCreatable
                data={categoryList}
                value={activeCategory?.name}
                onValueChange={val => changeActiveCategory(val || '')}
                placeholder="Select a category to edit"
                getCreateLabel={q => `+ Add category ${q}`}
                onCreate={q => addCategory(q)}
              />
              <ActionIcon color="red" size="md" onClick={removeCategory}>
                <IconX />
              </ActionIcon>
            </Group>
            {activeCategory && (
              <>
                <Divider />
                <TextInput
                  value={newOption}
                  onChange={setNewOption}
                  placeholder={`Add a new option for ${activeCategory.name}`}
                  rightSection={
                    <ActionIcon
                      onClick={addCategoryOption}
                      color="green"
                      radius="xl"
                      disabled={Boolean(
                        !newOption ||
                          (categoryOptions &&
                            categoryOptions
                              .map(o => o.name)
                              .includes(newOption))
                      )}
                    >
                      <IconCheck />
                    </ActionIcon>
                  }
                />
                {categoryOptions && (
                  <Center>
                    <Stack>
                      {categoryOptions.map(o => (
                        <Group justify="space-between" key={o.name}>
                          <span>{o.name}</span>
                          <ActionIcon
                            color="red"
                            size="md"
                            onClick={() => removeCategoryOption(o.name)}
                          >
                            <IconX />
                          </ActionIcon>
                        </Group>
                      ))}
                    </Stack>
                  </Center>
                )}
              </>
            )}
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
