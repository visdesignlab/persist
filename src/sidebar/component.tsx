import { useHookstate } from '@hookstate/core';
import { Box } from '@mantine/core';
import { useMemo } from 'react';
import { TrrackableCell } from '../cells';
import { TabComponents, TabbedSidebar } from '../components/TabbedSidebar';
import { PredictionList } from '../intent/Prediction';
import { TrrackVisComponent } from './trrackVis';

type Props = {
  cell: TrrackableCell;
};

const tabs = ['trrack', 'intent', 'selections'] as const;

type TabKey = (typeof tabs)[number];

export function SidebarComponent({ cell }: Props) {
  const predictions = useHookstate(cell.predictions);

  const tabComponents: TabComponents<TabKey> = useMemo(() => {
    return {
      trrack: {
        label: 'Trrack',
        component: <TrrackVisComponent cell={cell} />
      },
      intent: {
        label: 'Intent',
        component:
          predictions.value.length > 0 ? (
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
          ) : (
            <div>Make a selection</div>
          )
      },
      selections: {
        label: 'Selections',
        component: <div>Intent</div>
      }
    };
  }, [cell, predictions]);

  return <TabbedSidebar tabKeys={tabs} tabComponents={tabComponents} />;
}
