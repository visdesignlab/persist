import React, { useEffect } from 'react';
import { createRender, useModel, useModelState } from '@anywidget/react';
import { withTrrackableCell } from '../utils/useCell';
import {
  Badge,
  Button,
  Text,
  Divider,
  Group,
  Paper,
  Title,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  DFGenerationMessage,
  GeneratedRecord,
  postCreationAction
} from '../utils/dataframe';
import { PersistCommands } from '../../commands';
import { TrrackableCell } from '../../cells';
import { getInteractionsFromRoot } from '../trrack/utils';
import { HeaderActionIcon } from '../header/StyledActionIcon';
import { IconCopy, IconRowInsertTop, IconTrash } from '@tabler/icons-react';

type Props = {
  cell: TrrackableCell;
};

function DataframeFooter({ cell }: Props) {
  const [generatedDataframeRecord] = useModelState<GeneratedRecord>(
    'generated_dataframe_record'
  );

  const model = useModel();

  useEffect(() => {
    function _f({ msg }: DFGenerationMessage) {
      if (!msg) {
        return;
      }
      const { type, record, post = undefined } = msg;
      if (type === 'df_created') {
        postCreationAction(record, post);
      }
    }

    model.on('msg:custom', _f);

    return () => {
      model.off('msg:custom', _f);
    };
  }, [model]);

  return (
    <Paper shadow="lg" withBorder p="md" mx="xs">
      <Title size="h3">Datasets</Title>
      <Divider size="xs" my="md" />
      <Group>
        <Button
          size="xs"
          onClick={() => {
            const dfName = `persist_${Math.round(
              Math.random() * 100
            ).toString()}`;

            window.Persist.Commands.execute(PersistCommands.createDataframe, {
              cell,
              record: {
                dfName: dfName,
                root_id: cell.trrackManager.trrack.root.id,
                current_node_id: cell.trrackManager.trrack.current.id,
                interactions: getInteractionsFromRoot(cell.trrackManager.trrack)
              },
              model,
              post: 'copy'
            });
          }}
        >
          Add
        </Button>
        <Button size="xs">Delete</Button>
        <Button
          size="xs"
          onClick={() => {
            postCreationAction({ dfName: 'test' } as any, 'copy');
          }}
        >
          Copy
        </Button>
        <Button
          size="xs"
          onClick={() => {
            console.log('Insert');
            postCreationAction({ dfName: 'test' } as any, 'insert');
          }}
        >
          Insert
        </Button>
      </Group>
      <Group my="1em">
        {Object.keys(generatedDataframeRecord).map(k => (
          <Badge
            key={k}
            p="1em"
            variant="outline"
            rightSection={
              <Button.Group ml="1em">
                <Tooltip label="Copy to clipboard">
                  <HeaderActionIcon size="xs">
                    <IconCopy />
                  </HeaderActionIcon>
                </Tooltip>
                <Tooltip label="Insert new cell">
                  <HeaderActionIcon size="xs">
                    <IconRowInsertTop />
                  </HeaderActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <HeaderActionIcon size="xs">
                    <IconTrash />
                  </HeaderActionIcon>
                </Tooltip>
              </Button.Group>
            }
          >
            <Text sx={{ textTransform: 'none' }} variant="text" tt="unset">
              {k}
            </Text>
          </Badge>
        ))}
      </Group>
    </Paper>
  );
}

export const render = createRender(withTrrackableCell(DataframeFooter));
