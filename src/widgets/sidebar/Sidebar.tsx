import { Box, Center, Tabs, createStyles } from '@mantine/core';
import React from 'react';
import { TrrackableCell } from '../../cells';
import {
  useIntersection,
  useLocalStorage,
  useScrollIntoView
} from '@mantine/hooks';
import { Trrack } from '../trrack/Trrack';
import { Summary } from '../trrack/Summary';
import { IconGitMerge, IconListDetails } from '@tabler/icons-react';

type Props = {
  cell: TrrackableCell;
};

const MAX_SIDEBAR_HEIGHT = '555px';

const useStyles = createStyles(() => ({
  tabPanelContentContainer: {
    overflow: 'auto',
    margin: '0.5em',
    padding: '1em',
    maxHeight: MAX_SIDEBAR_HEIGHT
  },
  border: {
    border: '1px solid rgba(0, 0, 0, 0.2)'
  },
  content: {
    border: '1px solid rgba(100,100,100, 0.3)',
    backgroundColor: 'rgba(100,100,100, 0.1)'
  },
  removeOverflow: {
    ['& > div:first-of-type']: {
      overflow: 'hidden !important'
    }
  }
}));

export const TAB_KEYS = {
  TRRACK: { key: 'trrack', label: 'Trrack' },
  PREDICTIONS: { key: 'predictions', label: 'Predictions' },
  SUMMARY: { key: 'summary', label: 'Summary' }
};

export function Sidebar({ cell }: Props) {
  const [activeTab, setActiveTab] = useLocalStorage<string | null>({
    key: '_persist_sidebar_active_tab',
    defaultValue: TAB_KEYS.TRRACK.key
  });

  const { scrollIntoView, targetRef, scrollableRef } = useScrollIntoView<
    HTMLElement,
    HTMLDivElement
  >({
    duration: 300,
    isList: true,
    offset: 40
  });
  const { ref, entry } = useIntersection({
    root: scrollableRef.current
  });

  const { classes, cx } = useStyles();

  return (
    <Tabs value={activeTab} onTabChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value={TAB_KEYS.TRRACK.key} icon={<IconGitMerge />}>
          {TAB_KEYS.TRRACK.label}
        </Tabs.Tab>
        <Tabs.Tab icon={<IconListDetails />} value={TAB_KEYS.SUMMARY.key}>
          {TAB_KEYS.SUMMARY.label}
        </Tabs.Tab>
        {false && (
          <Tabs.Tab value={TAB_KEYS.PREDICTIONS.key}>
            {TAB_KEYS.PREDICTIONS.label}
          </Tabs.Tab>
        )}
      </Tabs.List>

      <Tabs.Panel value={TAB_KEYS.TRRACK.key}>
        <Box
          ref={scrollableRef}
          className={cx(
            classes.tabPanelContentContainer,
            classes.removeOverflow
          )}
        >
          <Trrack
            cell={cell}
            setCurrentNodeTarget={el => {
              if (el) {
                targetRef.current = el as HTMLElement;
                ref(targetRef.current);
              }
            }}
            scroll={() => {
              if (!entry?.isIntersecting) {
                scrollIntoView({ alignment: 'end' });
              }
            }}
          />
        </Box>
      </Tabs.Panel>
      <Tabs.Panel value={TAB_KEYS.PREDICTIONS.key}>
        <Box className={classes.tabPanelContentContainer}>
          <Center className={classes.content} h="400px">
            {Math.random().toFixed(4)}
          </Center>
        </Box>
      </Tabs.Panel>
      <Tabs.Panel value={TAB_KEYS.SUMMARY.key}>
        <Box className={classes.tabPanelContentContainer}>
          <Summary />
        </Box>
      </Tabs.Panel>
    </Tabs>
  );
}
