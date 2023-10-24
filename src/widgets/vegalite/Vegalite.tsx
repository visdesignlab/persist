import { createRender, useModel, useModelState } from '@anywidget/react';
import { LoadingOverlay, Stack } from '@mantine/core';
import { debounce } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { SignalListeners, VegaLite } from 'react-vega';
import { View } from 'vega';
import { TopLevelSpec } from 'vega-lite';
import { SelectionParameter } from 'vega-lite/build/src/selection';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';
import { VegaView } from '../../vega/view';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Vegalite({ cell }: Props) {
  const [spec] = useModelState<TopLevelSpec>('spec'); // Load spec
  const [selectionNames] = useModelState<string[]>('selection_names');
  const [selectionTypes] =
    useModelState<Record<string, 'point' | 'interval'>>('selection_types');
  const [signalListeners, setSignalListeners] = useState<SignalListeners>({});
  const [wait] = useModelState<number>('debounce_wait');
  const [isApplying] = useModelState<boolean>('is_applying');

  const vegaView = useMemo(() => {
    return new VegaView();
  }, []); // Initialize VegaView wrapper

  const model = useModel(); // Load widget model

  // Callback to set a Vega view object in VegaView
  const newViewCallback = useCallback(
    (view: View) => {
      vegaView.setView(view);

      const sigListeners: SignalListeners = {};

      selectionNames.forEach(name => {
        const storeName = `${name}_store`; // Store name for selection

        sigListeners[name] = debounce(
          (_: string, value: SelectionParameter['value']) => {
            window.Persist.Commands.execute(PersistCommands.intervalSelection, {
              cell,
              name,
              value,
              store: view.data(storeName) || [],
              brush_type: selectionTypes[name] || 'interval'
            });
          },
          wait || 200
        ) as any;
      });

      setSignalListeners(sigListeners);
    },
    [cell, model, vegaView, selectionNames, wait]
  );

  return (
    <Stack>
      <LoadingOverlay visible={isApplying} />
      <VegaLite
        spec={spec}
        onNewView={newViewCallback}
        signalListeners={signalListeners}
      />
    </Stack>
  );
}

// For anywidget
export const render = createRender(withTrrackableCell(Vegalite));
