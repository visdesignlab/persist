import { UseSignal } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import { ReadonlyJSONValue } from '@lumino/coreutils';
import {
  Modal,
  Popover,
  Text,
  Button,
  ColorSwatch,
  Group,
  Stack,
  TextInput
} from '@mantine/core';
import React, { useMemo, useState } from 'react';

export type CommandButtonProps<CR extends CommandRegistry = CommandRegistry> = {
  commands: CR;
  cId: string;
  cArgs?: ReadonlyJSONValue;
  bIcon?: string;
  label?: string;
  categories?: string[] | null;
  colorScale?: d3.ScaleOrdinal<string, string> | null;
  setCategories?: (s: string) => void;
};

export function CommandButton(props: CommandButtonProps) {
  const { commands, cId } = props;

  const [inputVal, setInputVal] = useState('');
  const [opened, setOpened] = useState(false);

  if (!commands.hasCommand(cId)) {
    console.warn(`Command ${cId} not found`);
    return null;
  }

  const button = useMemo(() => {
    return (
      <Button
        onClick={() => {
          if (props.categories) {
            setOpened(!opened);
            return;
          }
          commands.execute(cId);
        }}
      >
        {commands.label(cId)}
      </Button>
    );
  }, [commands, cId, props.categories, opened]);

  return (
    <UseSignal signal={commands.commandChanged}>
      {() =>
        props.categories ? (
          <Popover
            id={cId}
            width={300}
            position="bottom"
            withArrow
            opened={opened}
            onChange={setOpened}
            withinPortal
            shadow="md"
          >
            <Popover.Target>{button}</Popover.Target>
            <Popover.Dropdown>
              <Stack>
                <Stack>
                  <Text weight={700}>Current categories</Text>
                  {props.categories.map(cat => {
                    return (
                      <Group>
                        <ColorSwatch
                          size="10"
                          color={
                            props.colorScale ? props.colorScale(cat) : 'gray'
                          }
                        ></ColorSwatch>
                        <Text size={12}>{cat}</Text>
                      </Group>
                    );
                  })}
                </Stack>
                <Text weight={700}>Add a category</Text>
                <TextInput
                  value={inputVal}
                  onChange={event => setInputVal(event.currentTarget.value)}
                ></TextInput>
                <Button
                  onClick={() => {
                    props.setCategories?.(inputVal);
                  }}
                >
                  Add category
                </Button>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        ) : (
          button
        )
      }
    </UseSignal>
  );
}
