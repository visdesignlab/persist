import React, { useEffect } from 'react';
import { createRender, useModel, useModelState } from '@anywidget/react';
import { withTrrackableCell } from '../utils/useCell';
import { Button, Divider, Group, Paper, Title } from '@mantine/core';
import {
  DFGenerationMessage,
  GeneratedRecord,
  postCreationAction
} from '../utils/dataframe';
import { PersistCommands } from '../../commands';
import { TrrackableCell } from '../../cells';
import { getInteractionsFromRoot } from '../trrack/utils';
import { DataframeNameBadge } from '../components/DataframeNameBadge';

type Props = {
  cell: TrrackableCell;
};

export function DataframeFooter({ cell }: Props) {
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
      <Group mt="1em" p="1em">
        {Object.keys(generatedDataframeRecord || {}).map(k => (
          <DataframeNameBadge key={k} dfRecord={generatedDataframeRecord[k]} />
        ))}
      </Group>
    </Paper>
  );
}

export const render = createRender(withTrrackableCell(DataframeFooter));
