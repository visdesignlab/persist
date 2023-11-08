import React, { useRef, useState } from 'react';
import { MRT_Column } from 'mantine-react-table';
import { DataPoint } from './helpers';
import { Box, TextInput } from '@mantine/core';
import { getHotkeyHandler, useValidatedState } from '@mantine/hooks';
import { PERSIST_MANTINE_FONT_SIZE } from './constants';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';

type Props = {
  cell: TrrackableCell;
  column: MRT_Column<DataPoint>;
  allColumns: string[];
};

export function ColumnHeader({ column, allColumns, cell }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const [newColumnName, setNewColumnName] = useValidatedState(
    column.id,
    val => {
      return val.length > 0 && !allColumns.includes(val);
    },
    true
  );

  const [isEditing, setIsEditing] = useState(false);

  return isEditing ? (
    <TextInput
      ref={ref}
      value={newColumnName.value}
      onChange={e => {
        setNewColumnName(e.target.value);
      }}
      error={!newColumnName.valid}
      onBlur={() => {
        if (
          newColumnName.value &&
          newColumnName.value.length > 0 &&
          newColumnName.valid &&
          newColumnName.value !== column.id
        ) {
          window.Persist.Commands.execute(PersistCommands.renameColumns, {
            cell,
            renameColumnMap: {
              [column.id]: newColumnName.value
            }
          });
        } else {
          setNewColumnName(column.id);
        }
        setIsEditing(false);
      }}
      autoFocus
      onKeyDown={getHotkeyHandler([['Enter', () => ref.current?.blur()]])}
      size="xs"
    />
  ) : (
    <Box
      fz={PERSIST_MANTINE_FONT_SIZE}
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onDoubleClick={e => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
      }}
    >
      {column.id}
    </Box>
  );
}
