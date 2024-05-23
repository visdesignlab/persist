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
import React from 'react';
import { TrrackableCell } from '../../cells';
import { addCellWithDataframeVariable } from '../utils/dataframe';

type Props = {
  cell: TrrackableCell;
};

export function DataframeCode({ cell }: Props) {
  const [code = ''] = useModelState<string>('code');

  return (
    <Paper shadow="lg" withBorder p="md" mx="xs" h="100%">
      <ScrollArea.Autosize mah={300} type="auto">
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
