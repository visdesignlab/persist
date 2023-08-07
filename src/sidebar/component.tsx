import { useHookstate } from '@hookstate/core';
import { useMemo } from 'react';
import { TrrackableCell } from '../cells';
import { TabComponents, TabbedSidebar } from '../components/TabbedSidebar';
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
        component: (
          <div>
            {predictions.value.length > 0 ? (
              predictions.value.map(d => <div key={d.label}>{d.label}</div>)
            ) : (
              <div>None</div>
            )}
          </div>
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
