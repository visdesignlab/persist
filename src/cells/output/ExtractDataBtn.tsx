import { useHookstate } from '@hookstate/core';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconCopy, IconRefresh } from '@tabler/icons-react';
import { getInteractionsFromRoot } from '../../interactions/helpers';
import { copyStrToClipboard } from '../../utils/copyToClipboard';
import { TrrackableCell } from '../trrackableCell';
import { extractDfAndCopyName } from './extract_helpers';

type Props = {
  cell: TrrackableCell;
  id: string;
};

export function ExtractDataBtn({ cell }: Props) {
  const copyInteractionsMode = localStorage.getItem('DEBUG') || false;

  const current = cell.trrackManager.current;

  const graphDataframe = useHookstate(cell.generatedDataframes.graphDataframes);
  const graphDataframeName = graphDataframe.ornull?.name.get() || null;

  const nodeDataframes = useHookstate(cell.generatedDataframes.nodeDataframes);
  const nodeDataframeName =
    nodeDataframes.nested(current).ornull?.name.get() || null;

  return (
    <div
      onClick={ev => ev.stopPropagation()} // Prevent triggering the click on trrack
      style={{
        zIndex: 100,
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      {copyInteractionsMode && (
        <ActionIcon
          onClick={async ev => {
            ev.preventDefault();
            copyStrToClipboard(
              JSON.stringify(getInteractionsFromRoot(cell.trrackManager))
            );
          }}
        >
          <Tooltip.Floating label="DEBUG: Copy interaction chain">
            <IconCopy />
          </Tooltip.Floating>
        </ActionIcon>
      )}
      {!copyInteractionsMode && (
        <ActionIcon
          variant={
            !(!!graphDataframeName || !!nodeDataframeName)
              ? 'transparent'
              : 'subtle'
          }
          disabled={!(!!graphDataframeName || !!nodeDataframeName)}
          onClick={async () => {
            if (graphDataframeName) {
              await extractDfAndCopyName(
                cell,
                cell.trrackManager.current,
                graphDataframeName
              );
            }
            if (nodeDataframeName) {
              await extractDfAndCopyName(
                cell,
                cell.trrackManager.current,
                nodeDataframeName
              );
            }
          }}
        >
          <Tooltip.Floating label="Regenerate datasets">
            <IconRefresh />
          </Tooltip.Floating>
        </ActionIcon>
      )}
    </div>
  );
}
