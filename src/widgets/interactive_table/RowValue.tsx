import { Text, TextInput } from '@mantine/core';
import React, { useCallback, useState } from 'react';
import { TrrackableCell } from '../../cells';

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
