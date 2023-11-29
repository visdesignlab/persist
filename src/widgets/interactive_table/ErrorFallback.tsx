import { Button, Card, Center, Code, Group, Space } from '@mantine/core';
import React from 'react';
import { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  console.error(error);
  return (
    <Center>
      <Card shadow="lg" padding="lg" radius="md" ta="center">
        Something went wrong.
        <Space h="lg" />
        Please try one of the following actions to recover and/or report the
        issue.
        <Space h="lg" />
        <Code>{error.toString()}</Code>
        <Space h="lg" />
        <Group position="center">
          <Button onClick={() => resetErrorBoundary('undo')}>
            Undo last action
          </Button>
          <Button onClick={() => resetErrorBoundary('reset')}>
            Reset provenance
          </Button>
          {/* <Button onClick={() => resetErrorBoundary('save')}> */}
          {/*   Save copy of notebook */}
          {/* </Button> */}
        </Group>
      </Card>
    </Center>
  );
}
