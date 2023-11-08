import { useModelState } from '@anywidget/react';
import React, { useCallback } from 'react';
import { TrrackableCell } from '../../cells';
import { Button, Divider, Group } from '@mantine/core';
import { PersistCommands } from '../../commands';
import { IconFilterMinus, IconFilterPlus } from '@tabler/icons-react';
import { CommandButton } from './CommandButton';
import { Annotate } from './Annotate';
import { UseSignal } from '@jupyterlab/apputils';
import { RenameColumnPopover } from './RenameColumnPopover';
import { DropColumnPopover } from './DropColumnPopover';
import { EditCategoryPopover } from './EditCategoryPopover';
import { AssignCategoryPopover } from './AssignCategoryPopover';
import { GeneratedRecord } from '../utils/dataframe';

type Props = {
  cell: TrrackableCell;
};

export function Header({ cell }: Props) {
  const [hasSelections] = useModelState<boolean>('df_has_selections');
  const [generatedRecord, setGeneratedRecord] =
    useModelState<GeneratedRecord>('gdr_record');

  const resetDataframes = useCallback((record: GeneratedRecord) => {
    const newRecord: GeneratedRecord = {};

    Object.values(record).forEach(record => {
      if (record.isDynamic) {
        newRecord[record.dfName] = record;
      }
    });

    setGeneratedRecord(newRecord);
  }, []);

  return (
    <Group
      style={{
        borderBottom: '2px solid rgb(0, 0, 0, 10%)',
        padding: '1em'
      }}
    >
      <RenameColumnPopover cell={cell} />
      <DropColumnPopover cell={cell} />
      <Divider orientation="vertical" />
      <EditCategoryPopover cell={cell} />
      <AssignCategoryPopover cell={cell} />
      <Divider orientation="vertical" />
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.filterOut}
        icon={<IconFilterMinus />}
        isDisabled={!hasSelections}
        commandArgs={{
          direction: 'out'
        }}
      />
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.filterIn}
        icon={<IconFilterPlus />}
        isDisabled={!hasSelections}
        commandArgs={{
          direction: 'in'
        }}
      />
      <Divider orientation="vertical" />
      <UseSignal signal={window.Persist.Commands.registry.commandChanged}>
        {() => <Annotate cell={cell} isDisabled={!hasSelections} />}
      </UseSignal>
      <Divider orientation="vertical" />
      <Button.Group>
        <Button
          px="0.3em"
          size="xs"
          variant="subtle"
          onClick={() => {
            resetDataframes(generatedRecord);
            window.Persist.Commands.execute(PersistCommands.resetTrrack, {
              cell
            });
          }}
        >
          Reset Trrack
        </Button>
        <Button
          px="0.3em"
          size="xs"
          variant="subtle"
          onClick={() => resetDataframes(generatedRecord)}
        >
          Delete datasets
        </Button>
      </Button.Group>
    </Group>
  );
}
