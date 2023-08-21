import { State, useHookstate } from '@hookstate/core';
import { debounce } from 'lodash';

import { UUID } from '@lumino/coreutils';
import { ActionIcon, Box, LoadingOverlay } from '@mantine/core';
import { useDisclosure, useElementSize } from '@mantine/hooks';
import { IconCheck } from '@tabler/icons-react';
import { ScaleLinear, scaleLinear } from 'd3';
import { useCallback, useMemo } from 'react';
import { TrrackableCell } from '../cells';
import { Nullable } from '../utils';
import { deepClone } from '../utils/deepClone';
import { Prediction } from './types';

type PredictionListProps = {
  predictions: State<Prediction[]>;
  cell: TrrackableCell;
};

export function PredictionList({ predictions, cell }: PredictionListProps) {
  const { ref, width } = useElementSize();
  const isLoading = useHookstate(cell.isLoadingPredictions);

  const scale = useMemo(() => {
    return scaleLinear().domain([0, 1]).range([0, width]);
  }, [predictions, width]);

  return (
    <Box ref={ref}>
      <LoadingOverlay visible={isLoading.value} overlayBlur={2} />
      {!isLoading.value &&
        predictions.map(pred => (
          <PredictionComponent
            key={
              pred.value.intent + pred.value.algorithm + pred.value.rank_jaccard
            }
            scale={scale}
            prediction={pred}
            cell={cell}
          />
        ))}
    </Box>
  );
}

type PredictionComponentProps = {
  prediction: State<Prediction>;
  cell: TrrackableCell;
  scale: ScaleLinear<number, number>;
  height?: number;
};

export function PredictionComponent({
  prediction,
  scale,
  height = 30,
  cell
}: PredictionComponentProps) {
  const [hover, hoverHandlers] = useDisclosure(false);
  const { ref, width } = useElementSize();

  const notifyVegaOfHover = useCallback(
    debounce((pred: Nullable<Prediction>) => {
      cell.vegaManager?.hovered(pred);
    }, 100),
    [cell]
  );

  const fill = 'rgb(168,211,238)';

  return (
    <Box
      sx={{
        position: 'relative',
        cursor: 'pointer'
      }}
      onMouseOver={() => {
        hoverHandlers.open();
        notifyVegaOfHover(deepClone(prediction.value) as any);
      }}
      onMouseOut={() => {
        hoverHandlers.close();
        notifyVegaOfHover(null);
      }}
    >
      <svg ref={ref} height={height} width="100%">
        <rect
          height={height}
          width={width}
          fill={fill}
          opacity={hover ? 0.5 : 0.3}
        />
        <rect
          height={height}
          width={scale(prediction.value.rank_jaccard)}
          fill={fill}
          opacity="0.9"
        />
        <text
          transform={`translate(4, ${height / 2})`}
          dominantBaseline="middle"
          textAnchor="start"
        >{`${prediction.value.intent} - ${prediction.value.rank_jaccard.toFixed(
          3
        )}`}</text>
      </svg>
      {hover && (
        <ActionIcon
          sx={{
            position: 'absolute',
            right: 0,
            top: 0
          }}
          radius="xl"
          color="green"
          onClick={() => {
            console.log(deepClone(prediction.get()));

            cell.trrackManager.actions.addIntentSelection({
              id: UUID.uuid4(),
              type: 'intent',
              intent: prediction.get({ noproxy: true }) as any
            });
          }}
        >
          <IconCheck />
        </ActionIcon>
      )}
    </Box>
  );
}
