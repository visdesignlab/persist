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
  const [signalListeners, setSignalListeners] = useState<SignalListeners>({});
  const [wait] = useModelState<number>('debounce_wait');
  const [isApplying] = useModelState<boolean>('is_applying');

  console.log({ isApplying });

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
              store: view.data(storeName) || []
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

// /**
//  * The function `addSignalListeners` adds signal listeners to a Vega view based on the provided cell,
//  * view, and model parameters.
//  * @param {TrrackableCell} cell - The `cell` parameter is of type `TrrackableCell`. It represents a
//  * cell object that can be tracked.
//  *
//  * @param {VegaView} view - The `view` parameter is an instance of the VegaView class. It represents
//  * the view of the Vega visualization and provides methods for interacting with the visualization, such
//  * as adding signal listeners.
//  *
//  * @param {AnyModel} model - The `model` parameter is of type `AnyModel`. It represents the model
//  * object that contains the data and state of the application. It is used to retrieve and update the
//  * values of various properties, such as `selection_names`, `debounce_wait`, `selections`, and
//  * `param_object_map
//  */
// function addSignalListeners(
//   cell: TrrackableCell,
//   view: VegaView,
//   model: AnyModel
// ) {
//   //get names of all selection parameters
//   const selectionNames: string[] = model.get('selection_names');
//   // get debounce wait time
//   const wait = model.get('debounce_wait') || 200;
//
//   // loop over selections
//   for (const selectionName of selectionNames) {
//     const storeName = `${selectionName}_store`; // Store name for selection
//
//     // listener callback
//     const fn = (_: string, value: SelectionParameter['value']) => {
//       window.Persist.Commands.execute(PersistCommands.intervalSelection, {
//         cell,
//         name: selectionName,
//         store: view.getData(storeName) || [],
//         value
//       });
//     };
//
//     view.addSignalListener(selectionName, debounce(fn as any, wait));
//   }
// }
