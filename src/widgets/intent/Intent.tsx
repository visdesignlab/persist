import { createRender, useModelState } from '@anywidget/react';
import React, { useMemo } from 'react';
import { withTrrackableCell } from '../utils/useCell';
import { Text, ActionIcon, Box, Center } from '@mantine/core';
import { Prediction, Predictions } from '../../intent/types';
import { useDisclosure, useElementSize } from '@mantine/hooks';
import { ScaleLinear, scaleLinear } from 'd3';
import { TrrackableCell } from '../../cells';
import { IconCheck } from '@tabler/icons-react';

type Props = {
  cell: TrrackableCell;
};

export function Intent({ cell }: Props) {
  const { ref, width } = useElementSize();
  const [predictions] = useModelState<Predictions>('intents');
  const scale = useMemo(() => {
    return scaleLinear().domain([0, 1]).range([0, width]);
  }, [predictions, width]);

  return (
    <Box
      ref={ref}
      style={{
        minWidth: 300
      }}
    >
      {predictions.length > 0 &&
        predictions.map(pred => (
          <PredictionComponent
            key={pred.intent + pred.algorithm + pred.rank_jaccard}
            scale={scale}
            prediction={pred}
            cell={cell}
            rankGetter={p => p.rank_jaccard}
          />
        ))}
      {predictions.length === 0 && (
        <Center>
          <Text>No predictions available.</Text>
        </Center>
      )}
    </Box>
  );
}
type PredictionComponentProps = {
  prediction: Prediction;
  cell: TrrackableCell;
  scale: ScaleLinear<number, number>;
  rankGetter: (p: Prediction) => number;
  height?: number;
};

export function PredictionComponent({
  prediction,
  scale,
  height = 30,
  rankGetter
}: PredictionComponentProps) {
  const [hover] = useDisclosure(false);
  const { ref, width } = useElementSize();

  //   const notifyVegaOfHover = useCallback(
  //     debounce((pred: Nullable<Prediction>) => {
  //       cell.vegaManager?.hovered(pred);
  //     }, 100),
  //     [cell]
  //   );

  const computed_rank = rankGetter(prediction);

  const fill = 'rgb(168,211,238)';

  return (
    <Box
      style={{
        position: 'relative',
        cursor: 'pointer'
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
          width={scale(computed_rank)}
          fill={fill}
          opacity="0.9"
        />
        <text
          transform={`translate(4, ${height / 2})`}
          dominantBaseline="middle"
          textAnchor="start"
        >{`${prediction.intent} - ${computed_rank.toFixed(3)}`}</text>
      </svg>
      {hover && (
        <ActionIcon
          style={{
            position: 'absolute',
            right: 0,
            top: 0
          }}
          radius="xl"
          color="green"
          onClick={() => {
            // cell.trrackManager.actions.addIntentSelection({
            //   id: UUID.uuid4(),
            //   type: 'intent',
            //   intent: prediction.get({ noproxy: true }) as any
            // });
          }}
        >
          <IconCheck />
        </ActionIcon>
      )}
    </Box>
  );
}

export const render = createRender(withTrrackableCell(Intent));
