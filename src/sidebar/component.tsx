import { useHookstate } from '@hookstate/core';
import { Box, ColorSwatch, Tabs } from '@mantine/core';
import { useMemo } from 'react';
import { TrrackableCell } from '../cells';
import { TabComponents, TabbedSidebar } from '../components/TabbedSidebar';
import { PredictionList } from '../intent/Prediction';
import { TrrackVisComponent } from './trrackVis';

type Props = {
  cell: TrrackableCell;
};

export const tabs = ['trrack', 'intent', 'selections'] as const;

export type TabKey = (typeof tabs)[number];

export function SidebarComponent({ cell }: Props) {
  const predictions = useHookstate(cell.predictions);
  const newLoaded = useHookstate(cell.newPredictionsLoaded);
  const selections = useHookstate(cell.selectionsState);

  const tabComponents: TabComponents<TabKey> = useMemo(() => {
    return {
      trrack: {
        label: 'Trrack',
        component: <TrrackVisComponent cell={cell} />
      },
      intent: {
        label: 'Intent',
        component: (
          <Box
            sx={{
              paddingLeft: '0.5em',
              paddingRight: '0.5em',
              paddingTop: '1em',
              paddingBottom: '0.3em'
            }}
          >
            <PredictionList cell={cell} predictions={predictions} />
          </Box>
        ),
        header: (
          <Tabs.Tab
            value="intent"
            rightSection={
              newLoaded.get() ? <ColorSwatch color="green" size="xs" /> : null
            }
          >
            Intent
          </Tabs.Tab>
        )
      },
      selections: {
        label: 'Selections',
        component: (
          <div>
            {selections.get().map(s => (
              <div key={s}>{s}</div>
            ))}
          </div>
        )
      }
    };
  }, [cell, predictions, newLoaded.get()]);

  return (
    <TabbedSidebar cell={cell} tabKeys={tabs} tabComponents={tabComponents} />
  );
}
