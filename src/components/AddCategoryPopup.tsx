import {
  ActionIcon,
  Center,
  ColorSwatch,
  Divider,
  Group,
  Popover,
  Select,
  Stack,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { TrrackableCell } from '../cells';
import { Options } from '../interactions/categories';
import { Nullable } from '../utils';

type Props = {
  opened: boolean;
  onChange: (val: boolean) => void;
  cell: TrrackableCell;
};

export function AddCategoryPopup({ opened, onChange, cell }: Props) {
  const [newOption, setNewOption] = useInputState<string>('');
  const [categories, setCategories] = useState(cell.categories);
  const [activeCategory, setActiveCategory] = useState(cell.activeCategory);

  const addCategory = useCallback(
    (name: string, description?: string, options: Options = {}) => {
      const category = cell.addCategory(name, description, options);
      setCategories(cell.categories);
      return { ...category, label: name, value: name };
    },
    [cell]
  );

  const removeCategory = useCallback(() => {
    if (!activeCategory) {
      return;
    }
    cell.removeCategory(activeCategory.name);
    setCategories(cell.categories);
    setActiveCategory(cell.activeCategory);
  }, [cell, activeCategory]);

  const changeActiveCategory = useCallback(
    (category: Nullable<string>) => {
      cell.changeActiveCategory(category);
      setActiveCategory(cell.activeCategory);
    },
    [cell]
  );

  const addCategoryOption = useCallback(() => {
    if (!activeCategory || newOption.length === 0) {
      return;
    }

    cell.addCategoryOption(activeCategory.name, {
      name: newOption
    });
    setActiveCategory(cell.activeCategory);
    setNewOption('');
  }, [cell, activeCategory, newOption]);

  const removeCategoryOption = useCallback(
    (option: string) => {
      if (!activeCategory) {
        return;
      }

      cell.removeCategoryOption(activeCategory.name, option);
      setActiveCategory(cell.activeCategory);
      setNewOption('');
    },
    [cell, activeCategory]
  );

  const categoryOptions =
    activeCategory && Object.values(activeCategory.options);

  const categoryList = Object.values(categories).map(c => ({
    ...c,
    value: c.name,
    label: c.name
  }));

  const scale = cell.categoryColorScale;

  return (
    <Popover
      opened={opened}
      onChange={onChange}
      withinPortal
      withArrow
      shadow="xl"
    >
      <Popover.Target>
        <ActionIcon onClick={() => onChange(!opened)}>
          <Tooltip.Floating label="Edit categories" offset={20}>
            <IconPlus />
          </Tooltip.Floating>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Center miw={300} mt="sm" mb="md">
          <Stack>
            <Title order={3}>Active Category</Title>
            <Group>
              <Select
                data={categoryList}
                value={activeCategory?.name}
                onChange={val => changeActiveCategory(val)}
                placeholder="Select a category to edit"
                searchable
                creatable
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
                        <Group position="apart" key={o.name}>
                          <ColorSwatch color={scale(o.name)} size={15} />
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
