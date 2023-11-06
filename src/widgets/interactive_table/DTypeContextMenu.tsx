import { Group, Menu } from '@mantine/core';
import { IconCheck, IconPlayerPlayFilled } from '@tabler/icons-react';
import React from 'react';

import { MRT_Column } from 'mantine-react-table';
import { DataPoint } from './helpers';
import { useModelState } from '@anywidget/react';
import { PersistCommands } from '../../commands';
import { TrrackableCell } from '../../cells';

const pandasDTypes = [
  'Int64',
  'Float64',
  'string',
  'boolean',
  'datetime64[ns]',
  'category'
] as const;

export type PandasDTypes = (typeof pandasDTypes)[number];

type Props = {
  cell: TrrackableCell;
  column: MRT_Column<DataPoint>;
};

export function DTypeContextMenu({ cell, column }: Props) {
  const [dataframeDtypes] =
    useModelState<Record<string, PandasDTypes>>('df_column_dtypes');
  const [possibleConversions] =
    useModelState<Record<string, Array<PandasDTypes>>>('df_possible_dtypes');
  // Get dtypes and choose here
  //
  //

  return (
    <Menu
      position="right-start"
      offset={10}
      withArrow
      withinPortal
      trigger="hover"
      openDelay={200}
      closeDelay={400}
    >
      <Menu.Target>
        <Group position="apart">
          <span>Change column '{column.id}' data type</span>

          <IconPlayerPlayFilled size="1em" />
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        {possibleConversions[dataframeDtypes[column.id]].map(d => (
          <Menu.Item
            icon={
              <IconCheck opacity={dataframeDtypes[column.id] === d ? 1 : 0} />
            }
            key={d}
            disabled={dataframeDtypes[column.id] === d}
            onClick={() => {
              if (dataframeDtypes[column.id] === d) {
                return;
              }

              window.Persist.Commands.execute(
                PersistCommands.changeColumnDataType,
                {
                  cell,
                  columnDataTypes: {
                    [column.id]: d
                  }
                }
              );
            }}
          >
            {d}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
