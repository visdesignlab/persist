import { Validation, validation } from '@hookstate/validation';
import { CommandRegistry } from '@lumino/commands';

import { useHookstate } from '@hookstate/core';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Popover,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { IconCopy, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  TrrackableCell,
  addCellWithDataframeVariable,
  defaultGenerateDataframes,
  extractDataframe,
  extractDfAndCopyName,
  stringifyForCode
} from '../cells';
import { Executor } from '../notebook';
import { IDEGlobal } from '../utils';
import { isValidPythonVar } from '../utils/isValidPythonVar';
import { useDatasetFromVegaView } from '../vegaL/helpers';

type Props = {
  cell: TrrackableCell;
  commands: CommandRegistry;
};

const OPS = [
  'count',
  'sum',
  'min',
  'max',
  'mean',
  'median',
  'mode',
  'std',
  'var'
] as const;

const opsDropdownList = OPS.map(o => ({ value: o }));

export function CopyDFPopup({ cell }: Props) {
  const [opened, setOpened] = useState(false);
  const [dataframeType, setDataframeType] = useToggle<'static' | 'dynamic'>([
    'static',
    'dynamic'
  ]);

  const data = useDatasetFromVegaView(cell);
  const [isGroupBy, setIsGroupBy] = useState(false);
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const [selectedColumn, setSelectedColumn] = useState('');

  const generatedDataframes = useHookstate(cell.generatedDataframes);

  const nodeDataframes = useHookstate(cell.generatedDataframes.nodeDataframes);
  const graphDataframe = useHookstate(cell.generatedDataframes.graphDataframes);
  const currentNode = useHookstate(cell.trrackManager.currentState);

  const currentNodeDataframe = nodeDataframes.nested(currentNode.value);

  const dfName = useHookstate<string, Validation>(
    (dataframeType === 'static'
      ? currentNodeDataframe.ornull?.name.value
      : graphDataframe.value?.name) || '',
    validation()
  );

  dfName.validate(isValidPythonVar, 'Not a valid python variable');
  dfName.validate(v => v.length > 0, 'Variable cannot be empty');

  useEffect(() => {
    const code = Executor.withIDE(`
PR.get_dtypes(${stringifyForCode(data.values)})
`);

    Executor.execute(code).then(res => {
      if (res.status === 'ok') {
        const numericCols = Object.entries(res.result as Record<string, string>)
          .filter(([_, v]) => v.includes('64'))
          .map(([k, _]) => k) as any;

        setColumnTypes(
          numericCols.reduce(
            (acc: any, n: string) => ({ ...acc, [n]: 'count' }),
            {} as Record<string, string>
          )
        );
      } else {
        console.log(res);
      }
    });
  }, [data]);

  return (
    <Button.Group>
      <Popover
        opened={opened}
        onChange={setOpened}
        withinPortal
        withArrow
        shadow="xl"
      >
        <Popover.Target>
          <ActionIcon onClick={() => setOpened(!opened)}>
            <Tooltip.Floating label="Create a named dataframe">
              <IconCopy />
            </Tooltip.Floating>
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Center miw={300} mt="sm" mb="md">
            <Stack>
              <TextInput
                miw={300}
                error={!dfName.valid()}
                label="Create a named dataframe"
                rightSection={
                  dataframeType === 'dynamic' && <Text c="dimmed">_dyn</Text>
                }
                placeholder="Enter valid python variable name"
                value={dfName.value}
                onChange={e => {
                  const name = e.currentTarget.value;
                  dfName.set(name);
                }}
              />
              {!dfName.valid() && dfName.value.length > 0 && (
                <Text size="sm" mt="md">
                  {dfName.value} is not a valid python variable name.
                </Text>
              )}
              <Box>
                <Switch
                  size="md"
                  disabled={isGroupBy}
                  checked={!isGroupBy && dataframeType === 'dynamic'}
                  onChange={e =>
                    setDataframeType(
                      e.currentTarget.checked ? 'dynamic' : 'static'
                    )
                  }
                  description="Dynamic dataframes follow the current node"
                  label="Create dynamic dataframe"
                />
                <Switch
                  size="md"
                  disabled={true}
                  checked={isGroupBy}
                  onChange={e => {
                    setIsGroupBy(e.currentTarget.checked);
                    if (e.currentTarget.checked) {
                      setDataframeType('static');
                    }
                  }}
                  description="TODO: Create an aggregated dataframe based on of the columns"
                  label="TODO: Create aggregate dataframe"
                />
              </Box>
              <Stack
                sx={{
                  margin: '1em auto'
                }}
              >
                {isGroupBy && (
                  <Stack>
                    <Select
                      value={selectedColumn}
                      onChange={e => e && setSelectedColumn(e)}
                      label="Select column"
                      data={Object.keys(columnTypes).map(c => ({ value: c }))}
                    />
                    <Select
                      value={selectedColumn}
                      onChange={e =>
                        e &&
                        setColumnTypes({ ...columnTypes, [selectedColumn]: e })
                      }
                      label={`Select aggregate op for ${selectedColumn}`}
                      data={opsDropdownList}
                    />
                  </Stack>
                )}
              </Stack>
              <Group>
                <Button
                  disabled={!dfName.valid()}
                  onClick={async () => {
                    const name = await extractDfAndCopyName(
                      cell,
                      cell.trrackManager.current,
                      dataframeType === 'static'
                        ? dfName.value
                        : dfName.value + '_dyn'
                    );

                    setOpened(false);
                    dfName.set('');
                    if (dataframeType === 'static') {
                      currentNodeDataframe.set({
                        name,
                        nodeId: currentNode.value
                      });
                      await IDEGlobal.saveNotebook();
                    } else {
                      graphDataframe.set({
                        name,
                        graphId: cell.trrackManager.root
                      });
                      await IDEGlobal.saveNotebook();
                    }
                  }}
                >
                  Create & Copy
                </Button>
                <Button
                  disabled={!dfName.valid()}
                  onClick={async () => {
                    const { dfName: name } = await extractDataframe(
                      cell,
                      cell.trrackManager.current,
                      dataframeType === 'static'
                        ? dfName.value
                        : dfName.value + '_dyn'
                    );

                    if (dataframeType === 'static') {
                      currentNodeDataframe.set({
                        name,
                        nodeId: currentNode.value
                      });
                      await IDEGlobal.saveNotebook();
                    } else {
                      graphDataframe.set({
                        name,
                        graphId: cell.trrackManager.root
                      });
                      await IDEGlobal.saveNotebook();
                    }

                    setOpened(false);
                    dfName.set('');
                    addCellWithDataframeVariable(name);
                  }}
                >
                  Create & Insert Cell
                </Button>
              </Group>
            </Stack>
          </Center>
        </Popover.Dropdown>
      </Popover>
      <ActionIcon
        onClick={async () => {
          generatedDataframes.set(defaultGenerateDataframes);
          await IDEGlobal.saveNotebook();
        }}
      >
        <Tooltip.Floating label="Delete all datasets">
          <IconTrash />
        </Tooltip.Floating>
      </ActionIcon>
    </Button.Group>
  );
}
