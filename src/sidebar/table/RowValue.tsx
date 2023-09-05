import { UUID } from '@lumino/coreutils';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Popover,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TrrackableCell, getDataframeCode } from '../../cells';
import { getInteractionsFromRoot } from '../../interactions/helpers';
import { Interactions } from '../../interactions/types';
import { Executor } from '../../notebook';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { DraggableColumnHeader } from './DraggableColumnHeader';

export function RowValue({
  val,
  col,
  cell,
  index
}: {
  val: string;
  col: string;
  cell: TrrackableCell;
  index: number;
}) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedVal, setEditedVal] = useState<string>(val);

  const editedCallback = useCallback(() => {
    if (cell) {
      console.log('edited callback', val, col, cell, editedVal, index);
      const editVal: Interactions.EditValue = {
        id: UUID.uuid4(),
        type: 'editVal',
        column: col,
        index: index,
        value: editedVal
      };

      cell.trrackManager.actions.sort(
        editVal as any,
        () => `Edit value to ${editedVal}`
      );
    }
  }, [col, cell, index, editedVal]);

  return isEditing ? (
    <TextInput
      value={editedVal}
      onBlur={() => editedCallback()}
      onKeyDownCapture={e => {
        if (e.key === 'Enter') {
          editedCallback();
        }
      }}
      onChange={event => setEditedVal(event.currentTarget.value)}
    />
  ) : (
    <Text
      onDoubleClick={() => setIsEditing(true)}
      style={{
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
    >
      {val}
    </Text>
  );
}
