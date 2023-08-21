import { useHookstate } from '@hookstate/core';
import { Box, ColorSwatch, Stack, Tabs, Text } from '@mantine/core';
import { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { TrrackableCell } from '../cells';
import { TabComponents, TabbedSidebar } from '../components/TabbedSidebar';
import { PredictionList } from '../intent/Prediction';
import { getInteractionsFromRoot } from '../interactions/helpers';
import { TrrackManager } from '../trrack';
import { getDatasetFromVegaView } from '../vegaL/helpers';
import { TrrackVisComponent } from './trrackVis';

type Props = {
  cell: TrrackableCell;
};

export function interactionDescription(trrackManager: TrrackManager) {
  const interactions = getInteractionsFromRoot(trrackManager);

  const interactionStrings = interactions.map(interaction => {
    switch (interaction.type) {
      case 'selection':
        return 'Created selection with n data points';

      case 'aggregate':
        return `Aggregated selection by ${interaction.op} as \`${interaction.agg_name}\``;

      case 'categorize':
        return `Categorized selection as \`${interaction.selectedOption}\``;

      case 'create':
        return 'Created new plot';

      case 'filter':
        return `Filtered ${interaction.direction} the selection`;

      case 'intent':
        return `Applied ${interaction.intent.intent} selection`;

      case 'label':
        return `Labeled the selection \`${interaction.label}\``;

      case 'note':
        return 'Added note to selected points';

      case 'rename-column':
        return `Renamed column \`${interaction.prevColumnName}\` to \`${interaction.newColumnName}\``;

      case 'sort':
        return `Sorted ${interaction.col}, ${interaction.direction}`;
    }
  });

  return '* ' + interactionStrings.join(' \n * ');
}

export const tabs = ['trrack', 'description', 'intent', 'selections'] as const;

export type TabKey = (typeof tabs)[number];

export function SidebarComponent({ cell }: Props) {
  const predictions = useHookstate(cell.predictions);
  const newLoaded = useHookstate(cell.newPredictionsLoaded);
  const selections = useHookstate(cell.selectionsState);

  const points = cell.vegaManager
    ? getDatasetFromVegaView(cell.vegaManager.view, cell.trrackManager).values
    : [];

  console.log(JSON.parse(JSON.stringify(selections.value)));

  const filteredPoints = points.filter((_, i) => {
    return selections.value.includes(i as any);
  });

  const columns =
    points.length > 0
      ? Object.keys(points[0]).map(key => ({
          compact: true,
          minWidth: '50px',
          name: key,
          selector: (row: any) => row[key]
        }))
      : [];

  const tabComponents: TabComponents<TabKey> = useMemo(() => {
    return {
      trrack: {
        label: 'Trrack',
        header: (
          <Tabs.Tab value="trrack">
            <Text>Trrack</Text>
          </Tabs.Tab>
        ),
        component: <TrrackVisComponent cell={cell} />
      },
      description: {
        label: 'Description',
        component: (
          <Box
            sx={{
              paddingLeft: '0.5em',
              paddingRight: '0.5em',
              paddingTop: '1em',
              paddingBottom: '0.3em'
            }}
          >
            <Text style={{ whiteSpace: 'break-spaces' }}>
              {interactionDescription(cell.trrackManager)}
            </Text>
          </Box>
        )
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
          <Stack
            spacing={0}
            sx={{
              width: '100%',
              height: '100%'
            }}
          >
            <DataTable
              customStyles={{
                pagination: {
                  style: {
                    marginTop: 'auto'
                  }
                }
              }}
              pagination
              responsive
              data={filteredPoints}
              columns={columns}
              paginationComponentOptions={{ noRowsPerPage: true }}
            />
          </Stack>
        )
      }
    };
  }, [cell, predictions, newLoaded.get()]);

  return (
    <TabbedSidebar cell={cell} tabKeys={tabs} tabComponents={tabComponents} />
  );
}
