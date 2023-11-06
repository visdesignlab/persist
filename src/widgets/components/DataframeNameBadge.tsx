import React from 'react';
import { Badge, Button, createStyles } from '@mantine/core';
import { GenerationRecord } from '../utils/dataframe';
import { PersistActionIconButton } from '../header/StyledActionIcon';
import {
  IconCopy,
  IconExternalLink,
  IconRowInsertTop,
  IconTrash
} from '@tabler/icons-react';

type Props = {
  dfRecord: GenerationRecord;
  actions?: {
    copyToClipboard: boolean;
    insertInNewCell: boolean;
    delete: boolean;
    goToNode: boolean;
  };
};

const useStyles = createStyles(theme => ({
  dataframeBadgeRoot: {
    textTransform: 'unset'
  },
  actionButtons: {
    fontWeight: 'normal',
    paddingLeft: '0.5em',
    marginRight: '-0.5em'
  }
}));

export function DataframeNameBadge({ dfRecord }: Props) {
  const { classes } = useStyles();
  return (
    <Badge
      size="lg"
      classNames={{
        root: classes.dataframeBadgeRoot,
        rightSection: classes.actionButtons
      }}
      variant="outline"
      rightSection={
        <Button.Group>
          <PersistActionIconButton
            sx={{ fontWeight: 'unset' }}
            tooltipProps={{
              label: 'Copy dataframe to clipboard'
            }}
          >
            <IconCopy />
          </PersistActionIconButton>
          <PersistActionIconButton
            tooltipProps={{
              label: 'Insert dataframe in new cell'
            }}
          >
            <IconRowInsertTop />
          </PersistActionIconButton>
          <PersistActionIconButton
            tooltipProps={{
              label: 'Delete dataframe'
            }}
          >
            <IconTrash />
          </PersistActionIconButton>

          <PersistActionIconButton
            tooltipProps={{
              label: 'Go to node'
            }}
          >
            <IconExternalLink />
          </PersistActionIconButton>
        </Button.Group>
      }
    >
      {dfRecord.dfName}
    </Badge>
  );
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
