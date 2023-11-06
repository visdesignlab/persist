import { Text, TextInput, Tooltip } from '@mantine/core';
import React, { useCallback, useState } from 'react';
import { TrrackableCell } from '../../cells';
import { PERSIST_MANTINE_FONT_SIZE } from './constants';

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
    console.log('edited callback', val, col, editedVal, index);
  }, [col, cell, index, editedVal]);

  return isEditing ? (
    <TextInput
      value={editedVal}
      size="xs"
      onBlur={() => editedCallback()}
      onKeyDownCapture={e => {
        if (e.key === 'Enter') {
          editedCallback();
        }
      }}
      onChange={event => setEditedVal(event.currentTarget.value)}
    />
  ) : (
    <Tooltip.Floating label={val} color="gray" opacity={0.9}>
      <Text
        onDoubleClick={() => setIsEditing(true)}
        ta="right"
        style={{
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}
        fz={PERSIST_MANTINE_FONT_SIZE}
      >
        {val}
      </Text>
    </Tooltip.Floating>
  );
}
