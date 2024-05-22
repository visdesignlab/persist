import { useModelState } from '@anywidget/react';
import {
  Button,
  CopyButton,
  Group,
  Paper,
  ScrollArea,
  ThemeIcon
} from '@mantine/core';
import { Prism } from '@mantine/prism';
import { IconCheck, IconCopy, IconRowInsertTop } from '@tabler/icons-react';
import React, { useEffect, useRef } from 'react';
import { TrrackableCell } from '../../cells';
import { addCellWithDataframeVariable } from '../utils/dataframe';

type Props = {
  cell: TrrackableCell;
};

export function DataframeCode({ cell }: Props) {
  const [code] = useModelState<string>('code');

  // Remove Later
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current?.scrollHeight || 1000
    });
  }, [code]);
  // Remove Later

  return (
    <Paper shadow="lg" withBorder p="md" mx="xs" h="100%">
      <ScrollArea.Autosize mah={200} type="auto" viewportRef={ref}>
        <Prism language="python" noCopy>
          {code}
        </Prism>
      </ScrollArea.Autosize>
      <Group position="center" pt="xs">
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Button
              color={copied ? 'green' : 'blue'}
              onClick={copy}
              size="xs"
              leftIcon={
                <ThemeIcon color={copied ? 'green' : 'blue'}>
                  {copied ? <IconCheck size="xs" /> : <IconCopy size="2em" />}
                </ThemeIcon>
              }
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Button
          size="xs"
          leftIcon={
            <ThemeIcon size="sm">
              <IconRowInsertTop />
            </ThemeIcon>
          }
          onClick={() => {
            addCellWithDataframeVariable(code, false);
          }}
        >
          Insert
        </Button>
      </Group>
    </Paper>
  );
}
