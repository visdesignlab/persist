import { createRender, useModelState } from '@anywidget/react';
import React, { useEffect } from 'react';
import { withTrrackableCell } from '../utils/useCell';
import { TrrackableCell } from '../../cells';
import { DatatableComponent } from '../interactive_table/DatatableComponent';
import { Box, Group, MantineProvider, Stack } from '@mantine/core';
import { Header } from '../header/Header';
import { DataframeFooter } from '../dataframe_footer/DataframeFooter';
import { Sidebar } from '../sidebar/Sidebar';
import { Vegalite } from '../vegalite/Vegalite';

type Props = {
  cell: TrrackableCell;
};

const MAX_SIDEBAR_WIDTH = '350px';

const MAX_DATAFRAME_TOOLBAR_HEIGHT = '300px';

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
      <Stack justify="flex-start" spacing="xs">
        <Box>
          <Header cell={cell} />
        </Box>
        <Group position="apart" spacing="xs" align="flex-start">
          <Stack spacing="xs" sx={{ flex: 1, overflow: 'hidden' }}>
            <Box sx={{ overflow: 'auto' }}>{component}</Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Box mah={MAX_DATAFRAME_TOOLBAR_HEIGHT} sx={{ overflow: 'auto' }}>
                <DataframeFooter cell={cell} />
              </Box>
            </Box>
          </Stack>
          <Box w={MAX_SIDEBAR_WIDTH} sx={{ overflow: 'hidden' }}>
            <Sidebar cell={cell} />
          </Box>
        </Group>
      </Stack>
    </MantineProvider>
  );
}

export const render = createRender(withTrrackableCell(PersistOutput));
