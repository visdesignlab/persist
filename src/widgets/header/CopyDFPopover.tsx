import { Signal } from '@lumino/signaling';
import React from 'react';

import { Button, Center, Popover, Tooltip } from '@mantine/core';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { TrrackableCell } from '../../cells';

import { HeaderActionIcon } from './StyledActionIcon';

export const UPDATE = new Signal<any, string[]>({});

type Props = {
  cell: TrrackableCell;
};

export function CopyDFPopover({ cell }: Props) {
  const [opened, setOpened] = useState(false);
  cell;

  // const [groupBy, setGroupBy] = useState(false);
  // const [groupByColumn, setGroupByColumn] = useState<string | null>('None');
  //
  // const [columns] = useModelState<string[]>('df_non_meta_columns');
  //
  // const [dataframeType, setDataframeType] = useToggle<'static' | 'dynamic'>([
  //   'static',
  //   'dynamic'
  // ]);
  //
  // // Load from widget
  // const [, setNodeDataframeMapModel] = useModelState<GeneratedRecord>(
  //   'generated_dataframe_record'
  // );
  //
  // useEffect(() => {
  //   const unsub = cell.generatedDataframesState.subscribe(() => {
  //     setNodeDataframeMapModel(parseStringify(cell.generatedDataframes));
  //   });
  //
  //   try {
  //     setNodeDataframeMapModel(
  //       stripImmutableClone(
  //         parseStringify(cell.generatedDataframesState.get({ noproxy: true }))
  //       )
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   }
  //
  //   return unsub;
  // }, [cell]);
  //
  // const updateDataframeMapCb = useHookstateCallback(
  //   (record?: GenerationRecord) => {
  //     if (record) {
  //       cell.generatedDataframesState.nested(record.dfName).set(record);
  //     } else {
  //       cell.generatedDataframesState.set({});
  //     }
  //   },
  //   [cell]
  // );
  //
  // // Track input name
  // const dfName = useHookstate<string, Validation>('', validation());
  // dfName.validate(isValidPythonVar, 'Not a valid python variable');
  // dfName.validate(v => v.length > 0, 'Variable cannot be empty');

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
          <HeaderActionIcon variant="subtle" onClick={() => setOpened(!opened)}>
            <Tooltip.Floating label="Create a named dataframe">
              <IconCopy />
            </Tooltip.Floating>
          </HeaderActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Center miw={300} mt="sm" mb="md">
            {/* <Stack> */}
            {/*   <TextInput */}
            {/*     miw={300} */}
            {/*     size="xs" */}
            {/*     error={!dfName.valid()} */}
            {/*     label="Create a named dataframe" */}
            {/*     rightSection={ */}
            {/*       (dataframeType === 'dynamic' || */}
            {/*         (!groupBy && groupByColumn !== 'None')) && ( */}
            {/*         <Text c="dimmed" align="right"> */}
            {/*           {dataframeType === 'dynamic' && '_dyn'} */}
            {/*           {groupBy && groupByColumn !== 'None' && '_grouped'} */}
            {/*         </Text> */}
            {/*       ) */}
            {/*     } */}
            {/*     placeholder="Enter valid python variable name" */}
            {/*     value={dfName.value} */}
            {/*     onChange={e => { */}
            {/*       const name = e.currentTarget.value; */}
            {/*       dfName.set(name); */}
            {/*     }} */}
            {/*   /> */}
            {/*   {!dfName.valid() && dfName.value.length > 0 && ( */}
            {/*     <Text size="xs" mt="md"> */}
            {/*       {dfName.value} is not a valid python variable name. */}
            {/*     </Text> */}
            {/*   )} */}
            {/*   <Box> */}
            {/*     <Tooltip label="Dynamic dataframes follow the current node"> */}
            {/*       <Checkbox */}
            {/*         size="xs" */}
            {/*         checked={dataframeType === 'dynamic'} */}
            {/*         onChange={e => */}
            {/*           setDataframeType( */}
            {/*             e.currentTarget.checked ? 'dynamic' : 'static' */}
            {/*           ) */}
            {/*         } */}
            {/*         label="Create dynamic dataframe" */}
            {/*       /> */}
            {/*     </Tooltip> */}
            {/*   </Box> */}
            {/*   <Box> */}
            {/*     <Tooltip label="Choose a column to group on and customize the aggregation later."> */}
            {/*       <Checkbox */}
            {/*         size="xs" */}
            {/*         checked={groupBy} */}
            {/*         onChange={() => setGroupBy(g => !g)} */}
            {/*         label="Created grouped dataframe" */}
            {/*       /> */}
            {/*     </Tooltip> */}
            {/*   </Box> */}
            {/*   {groupBy && ( */}
            {/*     <Box> */}
            {/*       <Select */}
            {/*         size="xs" */}
            {/*         data={['None', ...columns].map(c => ({ */}
            {/*           label: c, */}
            {/*           value: c */}
            {/*         }))} */}
            {/*         value={groupByColumn} */}
            {/*         onChange={setGroupByColumn} */}
            {/*         placeholder="Select a column to group the dataset by." */}
            {/*         searchable */}
            {/*         label="Group By:" */}
            {/*       /> */}
            {/*     </Box> */}
            {/*   )} */}
            {/*   <Group> */}
            {/*     <Button */}
            {/*       size="xs" */}
            {/*       disabled={!dfName.valid()} */}
            {/*       onClick={async () => { */}
            {/*         const isDynamic = dataframeType === 'dynamic'; */}
            {/*         const isGrouped = */}
            {/*           groupBy && groupByColumn && groupByColumn !== 'None'; */}
            {/*         const trrack = cell.trrackManager.trrack; */}
            {/*         let name = isDynamic ? dfName.value + '_dyn' : dfName.value; */}
            {/**/}
            {/*         name = isGrouped ? name + '_grouped' : name; */}
            {/**/}
            {/*         const record: GenerationRecord = { */}
            {/*           dfName: name, */}
            {/*           root_id: trrack.root.id, */}
            {/*           current_node_id: isDynamic */}
            {/*             ? undefined */}
            {/*             : trrack.current.id, */}
            {/*           interactions: isDynamic */}
            {/*             ? [] */}
            {/*             : getInteractionsFromRoot(trrack) */}
            {/*         }; */}
            {/**/}
            {/*         if (isGrouped) { */}
            {/*           record.groupby = groupByColumn; */}
            {/*         } */}
            {/**/}
            {/*         updateDataframeMapCb(record); */}
            {/**/}
            {/*         setOpened(false); */}
            {/*         setTimeout(() => { */}
            {/*           dfName.set(''); */}
            {/*         }, 100); */}
            {/*       }} */}
            {/*     > */}
            {/*       Create & Copy */}
            {/*     </Button> */}
            {/*     <Button */}
            {/*       size="xs" */}
            {/*       disabled={!dfName.valid()} */}
            {/*       onClick={async () => { */}
            {/*         const isDynamic = dataframeType === 'dynamic'; */}
            {/*         const isGrouped = */}
            {/*           groupBy && groupByColumn && groupByColumn !== 'None'; */}
            {/*         const trrack = cell.trrackManager.trrack; */}
            {/*         let name = isDynamic ? dfName.value + '_dyn' : dfName.value; */}
            {/**/}
            {/*         name = isGrouped ? name + '_grouped' : name; */}
            {/**/}
            {/*         const record: GenerationRecord = { */}
            {/*           dfName: name, */}
            {/*           root_id: trrack.root.id, */}
            {/*           current_node_id: isDynamic */}
            {/*             ? undefined */}
            {/*             : trrack.current.id, */}
            {/*           interactions: isDynamic */}
            {/*             ? [] */}
            {/*             : getInteractionsFromRoot(trrack) */}
            {/*         }; */}
            {/**/}
            {/*         if (isGrouped) { */}
            {/*           record.groupby = groupByColumn; */}
            {/*         } */}
            {/**/}
            {/*         updateDataframeMapCb(record); */}
            {/**/}
            {/*         setOpened(false); */}
            {/*         setTimeout(() => { */}
            {/*           dfName.set(''); */}
            {/*         }, 100); */}
            {/*       }} */}
            {/*     > */}
            {/*       Create & Insert Cell */}
            {/*     </Button> */}
            {/*   </Group> */}
            {/* </Stack> */}
          </Center>
        </Popover.Dropdown>
      </Popover>
    </Button.Group>
  );
}
