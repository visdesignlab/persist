import { useHookstate } from '@hookstate/core';
import { Tabs } from '@mantine/core';
import { useEffect } from 'react';
import { TrrackableCell } from '../cells';

export type TabComponent = {
  label: string;
  component: JSX.Element;
  header?: JSX.Element;
};

export type TabComponents<K extends string> = Record<K, TabComponent>;

type Props<K extends string> = {
  cell: TrrackableCell;
  tabKeys: ReadonlyArray<K>;
  tabComponents: TabComponents<K>;
};

export function TabbedSidebar<K extends string>({
  tabKeys = [],
  tabComponents,
  cell
}: Props<K>) {
  const activeTab = useHookstate(cell.activeTab);

  useEffect(() => {
    if (activeTab.value === 'intent') {
      cell.newPredictionsLoaded.set(false);
    }
  }, [cell, activeTab]);

  return (
    <Tabs
      sx={{ minWidth: 350, width: 350, height: '90%' }}
      defaultValue="trrack"
      variant="outline"
      value={activeTab.value}
      onTabChange={activeTab.set as any}
    >
      <Tabs.List grow position="center">
        {tabKeys.map(key =>
          tabComponents[key].header ? (
            <>{tabComponents[key].header}</>
          ) : (
            <Tabs.Tab value={key} key={key}>
              {tabComponents[key].label}
            </Tabs.Tab>
          )
        )}
      </Tabs.List>
      {tabKeys.map(key => (
        <Tabs.Panel
          sx={{ height: '90%', maxHeight: '90%', overflow: 'auto' }}
          value={key}
          key={key}
        >
          {tabComponents[key].component}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
