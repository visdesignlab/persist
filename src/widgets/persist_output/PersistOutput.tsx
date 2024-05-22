import { createRender, useModelState } from '@anywidget/react';
import { Box, Group, MantineProvider, Stack } from '@mantine/core';
import React, { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TrrackableCell } from '../../cells';
import { DataframeCode } from '../dataframe_code/DataframeCode';
import { DataframeFooter } from '../dataframe_footer/DataframeFooter';
import { Header } from '../header/Header';
import { DatatableComponent } from '../interactive_table/DatatableComponent';
import { ErrorFallback } from '../interactive_table/ErrorFallback';
import { Sidebar } from '../sidebar/Sidebar';
import { withTrrackableCell } from '../utils/useCell';
import { Vegalite } from '../vegalite/Vegalite';

type Props = {
  cell: TrrackableCell;
};

const MAX_SIDEBAR_WIDTH = '350px';

const MAX_BOTTOM_TOOLBAR_HEIGHT = '500px';
const MIN_BOTTOM_TOOLBAR_HEIGHT = '100px';

export function PersistOutput({ cell }: Props) {
  const [isChart] = useModelState<boolean>('is_chart');

  useEffect(() => {
    cell.tagAsPersistCell();
  }, [cell]);

  const component = isChart ? (
    <Vegalite cell={cell} />
  ) : (
    <DatatableComponent cell={cell} />
  );

  return (
    <MantineProvider
      withNormalizeCSS
      withGlobalStyles
      theme={{
        components: {
          MenuItem: {
            defaultProps: {
              size: 'xs'
            }
          },
          ThemeIcon: {
            defaultProps: {
              size: 'xs'
            }
          }
        }
      }}
    >
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={({ args }: any) => {
          const action = args[0];

          switch (action) {
            case 'reset':
              cell.trrackManager.reset();
              break;
            case 'undo':
              cell.trrackManager.trrack.undo();
              break;
            case 'save':
              window.Persist.Notebook.save(true);
              break;
            default:
              console.log('Incorrect action');
          }
        }}
      >
        <Stack justify="flex-start" spacing="xs">
          <Box>
            <Header cell={cell} />
          </Box>
          <Group position="apart" spacing="xs" align="flex-start">
            <Stack spacing="xs" sx={{ flex: 1, overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>{component}</Box>
              <Box sx={{ overflow: 'hidden' }}>
                <Stack
                  spacing="xs"
                  mah={MAX_BOTTOM_TOOLBAR_HEIGHT}
                  mih={MIN_BOTTOM_TOOLBAR_HEIGHT}
                  sx={{ overflow: 'auto' }}
                  align="stretch"
                >
                  <DataframeFooter cell={cell} />
                  <DataframeCode cell={cell} />
                </Stack>
              </Box>
            </Stack>
            <Box w={MAX_SIDEBAR_WIDTH} sx={{ overflow: 'hidden' }}>
              <Sidebar cell={cell} />
            </Box>
          </Group>
        </Stack>
      </ErrorBoundary>
    </MantineProvider>
  );
}

export const render = createRender(withTrrackableCell(PersistOutput));
