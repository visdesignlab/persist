import React, { useEffect, useMemo } from 'react';
import {
  Button,
  Center,
  Divider,
  Group,
  HoverCard,
  Popover,
  Select,
  Stack,
  Title,
  Tooltip,
  Text,
  createStyles,
  rem,
  Switch
} from '@mantine/core';
import { useDisclosure, useListState, useSessionStorage } from '@mantine/hooks';
import { IconGripVertical, IconHelp, IconPlus } from '@tabler/icons-react';
import { TrrackableCell } from '../../cells';
import { HeaderActionIcon, PersistActionIconButton } from './StyledActionIcon';
import { useModelState } from '@anywidget/react';
import { PersistCommands } from '../../commands';
import { Categories, Option } from '../../interactions/categorize';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { IconMinus } from '@tabler/icons-react';

type Props = {
  cell: TrrackableCell;
};

const useStyles = createStyles(theme => {
  return {
    item: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5em',
      borderRadius: theme.radius.md,
      border: `${rem('1px')} solid ${theme.colors.gray[2]}`,
      backgroundColor: theme.colors.white,
      marginBottom: theme.spacing.xs
    },
    itemDragging: {
      boxShadow: theme.shadows.sm,
      cursor: 'grabbing'
    },
    dragHandle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: theme.colors.gray[6],
      cursor: 'grab'
    },
    hideDragHandle: {
      opacity: 0.3,
      pointerEvents: 'none'
    }
  };
});

export function AddCategoryPopover({ cell }: Props) {
  const { classes, cx } = useStyles();
  const [opened, openHandlers] = useDisclosure(true);
  const [selectedCategory, setSelectedCategory] = useSessionStorage<
    string | null
  >({
    key: '__persist_edit_category_selected',
    defaultValue: null,
    getInitialValueInEffect: true
  });

  const [categoriesColumnRecord] = useModelState<Categories>(
    'df_category_columns'
  );

  const categories = useMemo(() => {
    return Object.keys(categoriesColumnRecord);
  }, [categoriesColumnRecord]);

  const opts = selectedCategory
    ? categoriesColumnRecord[selectedCategory].options
    : [];

  const [options, optionsHandlers] = useListState<Option>(opts);

  useEffect(() => {
    if (opts !== options) {
      optionsHandlers.setState(opts);
    }
  }, [opts, options]);

  const ordered = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }

    return categoriesColumnRecord[selectedCategory].ordered;
  }, [categoriesColumnRecord, selectedCategory]);

  useEffect(() => {
    setSelectedCategory(p =>
      p && categories.includes(p)
        ? p
        : categories.length > 0
        ? categories[0]
        : null
    );
  }, [categories]);

  console.log(ordered);

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
        <Center mt="sm" mb="md">
          <Stack>
            <Title size="xs" order={3}>
              Edit Categories
            </Title>
            <Group position="center">
              <Select
                size="xs"
                label="Select a category to edit"
                placeholder="Search for a category..."
                data={categories}
                clearButtonProps={{
                  title: 'Clear selected category'
                }}
                searchable
                clearable
                creatable
                getCreateLabel={q => `+ Add category '${q}'`}
                onCreate={q => {
                  window.Persist.Commands.execute(PersistCommands.categorize, {
                    cell,
                    action: {
                      op: 'add',
                      scope: 'category',
                      category: q
                    },
                    overrideLabel: `Add new category '${q}'`
                  });

                  return q;
                }}
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
              <HoverCard withArrow shadow="xl">
                <HoverCard.Target>
                  <PersistActionIconButton size="sm">
                    <IconHelp />
                  </PersistActionIconButton>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <p>
                    Start typing to search for categorical column and select it.
                    You can also add a new one if you can't find one.
                  </p>
                  <p>
                    For the selected column you can add/remove options, mark the
                    column as ordered and change the order of the options.
                  </p>
                </HoverCard.Dropdown>
              </HoverCard>
            </Group>
            {selectedCategory && (
              <>
                <Divider />
                <Title size="sx">Manage options for '{selectedCategory}'</Title>

                {ordered !== undefined && ordered !== null && (
                  <Switch
                    checked={ordered}
                    size="xs"
                    label="Order options"
                    onChange={() => {
                      window.Persist.Commands.execute(
                        PersistCommands.categorize,
                        {
                          cell,
                          action: {
                            op: 'reorder',
                            scope: 'options',
                            category: selectedCategory,
                            option: !ordered
                          },
                          overrideLabel: `Make category '${selectedCategory}' ${
                            ordered ? 'unordered' : 'ordered'
                          }`
                        }
                      );
                    }}
                  />
                )}

                {options.length > 0 && (
                  <>
                    <DragDropContext
                      onDragEnd={({ destination, source }) => {
                        const opts = [...options];

                        opts.splice(
                          destination?.index || 0,
                          0,
                          ...opts.splice(source.index, 1)
                        );

                        window.Persist.Commands.execute(
                          PersistCommands.categorize,
                          {
                            cell,
                            action: {
                              op: 'reorder',
                              scope: 'options',
                              category: selectedCategory,
                              option: opts
                            },
                            overrideLabel: `Reorder options for '${selectedCategory}'`
                          }
                        );

                        optionsHandlers.reorder({
                          from: source.index,
                          to: destination?.index || 0
                        });
                      }}
                    >
                      <Droppable droppableId="dnd-list" direction="vertical">
                        {provided => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {options.map((item, index) => (
                              <Draggable
                                key={item}
                                draggableId={item}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <Group
                                    position="apart"
                                    spacing="xs"
                                    className={cx(classes.item, {
                                      [classes.itemDragging]:
                                        snapshot.isDragging
                                    })}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                  >
                                    <div
                                      className={cx(classes.dragHandle, {
                                        [classes.hideDragHandle]: !ordered
                                      })}
                                      {...provided.dragHandleProps}
                                    >
                                      <IconGripVertical size="2em" />
                                    </div>
                                    <Text>{item}</Text>
                                    <PersistActionIconButton>
                                      <IconMinus />
                                    </PersistActionIconButton>
                                  </Group>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </>
                )}

                <Divider />
                <Button
                  color="red"
                  size="xs"
                  onClick={() => {
                    window.Persist.Commands.execute(
                      PersistCommands.categorize,
                      {
                        cell,
                        action: {
                          op: 'remove',
                          scope: 'category',
                          category: selectedCategory
                        },
                        overrideLabel: `Delete category '${selectedCategory}'`
                      }
                    );
                  }}
                >
                  Delete category '{selectedCategory}'
                </Button>
              </>
            )}
          </Stack>
        </Center>
      </Popover.Dropdown>
    </Popover>
  );
}
