import React from 'react';
import {
  Badge,
  Button,
  Group,
  ThemeIcon,
  Tooltip,
  createStyles
} from '@mantine/core';
import { GenerationRecord, postCreationAction } from '../utils/dataframe';
import { PersistActionIconButton } from '../header/StyledActionIcon';
import {
  IconCopy,
  IconExternalLink,
  IconPinFilled,
  IconRowInsertTop,
  IconTrash
} from '@tabler/icons-react';
import { TrrackableCell } from '../../cells';

type Props = {
  cell: TrrackableCell;
  dfRecord: GenerationRecord;
  onDelete?: (record: GenerationRecord) => void;
  tooltip?: boolean;
  actions?: Partial<{
    copyToClipboard: boolean;
    insertInNewCell: boolean;
    deleteEntry: boolean;
    goToNode: boolean;
  }>;
};

const useStyles = createStyles(() => ({
  dataframeBadgeRoot: {
    textTransform: 'unset'
  },
  actionButtons: {
    fontWeight: 'normal',
    paddingLeft: '0.5em',
    marginRight: '-0.5em'
  }
}));

export function DataframeNameBadge({
  cell,
  dfRecord,
  onDelete,
  tooltip = false,
  actions = {}
}: Props) {
  const { classes } = useStyles();

  const {
    copyToClipboard = true,
    insertInNewCell = true,
    deleteEntry = !dfRecord.isDynamic,
    goToNode = !dfRecord.isDynamic
  } = actions;

  const badge = (
    <Badge
      size="md"
      classNames={{
        root: classes.dataframeBadgeRoot,
        rightSection: classes.actionButtons
      }}
      variant="outline"
      leftSection={
        dfRecord.isDynamic ? (
          <Group>
            <ThemeIcon size="xs" radius="xl" variant="subtle">
              <IconPinFilled />
            </ThemeIcon>
          </Group>
        ) : null
      }
      rightSection={
        <Button.Group>
          {copyToClipboard && (
            <PersistActionIconButton
              color="blue"
              sx={{ fontWeight: 'unset' }}
              tooltipProps={{
                label: 'Copy dataframe to clipboard'
              }}
              onClick={() => {
                postCreationAction(dfRecord, 'copy');
              }}
            >
              <IconCopy />
            </PersistActionIconButton>
          )}

          {insertInNewCell && (
            <PersistActionIconButton
              color="blue"
              tooltipProps={{
                label: 'Insert dataframe in new cell'
              }}
              onClick={() => {
                postCreationAction(dfRecord, 'insert');
              }}
            >
              <IconRowInsertTop />
            </PersistActionIconButton>
          )}

          {goToNode && (
            <PersistActionIconButton
              color="blue"
              tooltipProps={{
                label: 'Go to node'
              }}
              onClick={() => {
                cell.trrackManager.trrack.to(
                  dfRecord.current_node_id || cell.trrackManager.trrack.root.id
                );
              }}
            >
              <IconExternalLink />
            </PersistActionIconButton>
          )}

          {deleteEntry && (
            <PersistActionIconButton
              color="blue"
              tooltipProps={{
                label: 'Delete dataframe'
              }}
              onClick={() => {
                onDelete && onDelete(dfRecord);
              }}
            >
              <IconTrash />
            </PersistActionIconButton>
          )}
        </Button.Group>
      }
    >
      {dfRecord.dfName}
    </Badge>
  );

  if (tooltip) {
    return (
      <Tooltip zIndex={10000000} label={dfRecord.dfName}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
}

// unstyled
// sx={{
//   display: 'flex',
//   justifyContent: 'space-between',
//   textTransform: 'unset'
// }}
// key={k}
// p="1em"
// variant="outline"
