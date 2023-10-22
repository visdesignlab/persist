import { createRender, useModelState } from '@anywidget/react';
import React from 'react';
import { TrrackableCell } from '../../cells';
import { withTrrackableCell } from '../utils/useCell';
import { Box, Divider, Group, Indicator } from '@mantine/core';
import { PersistCommands } from '../../commands';
import {
  IconFilterMinus,
  IconFilterPlus,
  IconRefresh
} from '@tabler/icons-react';
import { CommandButton } from './CommandButton';
import { Annotate } from './Annotate';
import { UseSignal } from '@jupyterlab/apputils';
import { RenameColumnPopover } from './RenameColumnPopover';
import { DropColumnPopover } from './DropColumnPopover';
import { AddCategoryPopover } from './AddCategoryPopover';
import { AssignCategoryPopover } from './AssignCategoryPopover';
import { CopyDFPopover } from './CopyDFPopover';

type Props = {
  cell: TrrackableCell;
};

function Header({ cell }: Props) {
  const [hasSelections] = useModelState('df_has_selections');
  const [dfBeingGenerated] = useModelState<string | null>('df_being_generated');

  console.log({ dfBeingGenerated });

  return (
    <Group
      sx={{
        borderBottom: '2px solid rgb(0, 0, 0, 10%)',
        padding: '1em'
      }}
    >
      <CommandButton
        cell={cell}
        commandRegistry={window.Persist.Commands.registry}
        commandId={PersistCommands.resetTrrack}
        icon={<IconRefresh />}
      />
      <Divider orientation="vertical" />
      <RenameColumnPopover cell={cell} />
      <DropColumnPopover cell={cell} />
      <Divider orientation="vertical" />
      <AddCategoryPopover cell={cell} />
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
      <Divider orientation="vertical" />
      <UseSignal signal={window.Persist.Commands.registry.commandChanged}>
        {() => <Annotate cell={cell} />}
      </UseSignal>
      <Divider orientation="vertical" />
      <CopyDFPopover cell={cell} />
      <Divider orientation="vertical" />
      <Box
        sx={{
          marginLeft: 'auto'
        }}
      >
        <Indicator
          position="middle-start"
          offset={-10}
          display="inline"
          color={
            dfBeingGenerated && dfBeingGenerated.length > 0
              ? '#E69F00'
              : '#009E73'
          }
        >
          {dfBeingGenerated && dfBeingGenerated.length > 0
            ? `Generating ${dfBeingGenerated}`
            : 'All datasets generated'}
        </Indicator>
      </Box>
    </Group>
  );
}

export const render = createRender(withTrrackableCell(Header));
