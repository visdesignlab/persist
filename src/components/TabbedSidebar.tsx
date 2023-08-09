import { Tabs } from '@mantine/core';

export type TabComponent = {
  label: string;
  component: JSX.Element;
};

export type TabComponents<K extends string> = Record<K, TabComponent>;

type Props<K extends string> = {
  tabKeys: ReadonlyArray<K>;
  tabComponents: TabComponents<K>;
};

export function TabbedSidebar<K extends string>({
  tabKeys,
  tabComponents
}: Props<K>) {
  return (
    <Tabs
      sx={{ minWidth: 300, height: '90%' }}
      defaultValue="trrack"
      variant="outline"
    >
      <Tabs.List grow position="center">
        {tabKeys.map(key => (
          <Tabs.Tab value={key} key={key}>
            {tabComponents[key].label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabKeys.map(key => (
        <Tabs.Panel
          sx={{ maxHeight: '90%', overflow: 'auto' }}
          value={key}
          key={key}
        >
          {tabComponents[key].component}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
