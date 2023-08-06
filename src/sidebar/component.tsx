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
  const tabComponents: TabComponents<TabKey> = useMemo(() => {
    return {
      trrack: {
        label: 'Trrack',
        component: <TrrackVisComponent cell={cell} />
      },
      intent: {
        label: 'Intent',
        component: <div>Intent</div>
      },
      selections: {
        label: 'Selections',
        component: <div>Intent</div>
      }
    };
  }, [cell]);

  return <TabbedSidebar tabKeys={tabs} tabComponents={tabComponents} />;
}
