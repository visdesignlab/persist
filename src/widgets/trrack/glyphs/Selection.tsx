import React from 'react';
import { IconClick } from '@tabler/icons-react';
import { GlyphProps } from './types';

export function SelectionIcon({ type = 'regular' }: GlyphProps) {
  switch (type) {
    default:
      return <IconClick />;
  }
}
