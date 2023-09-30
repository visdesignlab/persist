import { createRender, useModel, useModelState } from '@anywidget/react';
import { AnyModel } from '@anywidget/types';
import { Stack } from '@mantine/core';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { View } from 'vega';
import { TopLevelSpec } from 'vega-lite';
import { SelectionParameter } from 'vega-lite/build/src/selection';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';
import { parseStringify } from '../../utils/jsonHelpers';
import { VegaView } from '../../vega/view';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Vegalite({ cell }: Props) {
  const [spec] = useModelState<TopLevelSpec>('spec'); // Load spec

  const vegaView = useMemo(() => {
    return new VegaView();
  }, []); // Initialize VegaView wrapper

  const model = useModel(); // Load widget model

  // Callback to set a Vega view object in VegaView
  const newViewCallback = useCallback(
    (view: View) => {
      vegaView.setView(view);
      addSignalListeners(cell, vegaView, model);
    },
    [cell, model, vegaView]
  );

  useEffect(() => {
    // Update the spec in cell metadata when it changes
    cell.vegaliteSpecState.set(spec);
  }, [spec, cell]);

  return (
    <Stack>
      <VegaLite spec={spec} onNewView={newViewCallback} />
    </Stack>
  );
}

// For anywidget
export const render = createRender(withTrrackableCell(Vegalite));

/**
 * The function `addSignalListeners` adds signal listeners to a Vega view based on the provided cell,
 * view, and model parameters.
 * @param {TrrackableCell} cell - The `cell` parameter is of type `TrrackableCell`. It represents a
 * cell object that can be tracked.
 *
 * @param {VegaView} view - The `view` parameter is an instance of the VegaView class. It represents
 * the view of the Vega visualization and provides methods for interacting with the visualization, such
 * as adding signal listeners.
 *
 * @param {AnyModel} model - The `model` parameter is of type `AnyModel`. It represents the model
 * object that contains the data and state of the application. It is used to retrieve and update the
 * values of various properties, such as `selection_names`, `debounce_wait`, `selections`, and
 * `param_object_map
 */
function addSignalListeners(
  cell: TrrackableCell,
  view: VegaView,
  model: AnyModel
) {
  const { trrackActions = null } = cell;

  // if actions are not defined, stop!
  if (!trrackActions) {
    return;
  }

  //get names of all selection parameters
  const selectionNames: string[] = model.get('selection_names');
  // get debounce wait time
  const wait: number = model.get('debounce_wait') || 200;

  // loop over params
  for (const selectionName of selectionNames) {
    const storeName = `${selectionName}_store`; // Store name for selection

    // listener callback
    const fn = (_: string, value: SelectionParameter['value']) => {
      const selections = parseStringify(model.get('selections')) || {}; // get existing selections from model
      const selectionParamDefs =
        parseStringify(model.get('param_object_map')) || {}; // get selection definition from model

      const store = parseStringify(view.getData(storeName)) || []; // get store from view

      // Apply command
      window.Persist.Commands.execute(PersistCommands.intervalSelection, {
        cell,
        selection: selectionParamDefs[selectionName],
        store,
        value,
        encodingTypes: {}
      });

      selections[selectionName] = { value, store };

      model.set('selections', selections); // update selections in model
      model.save_changes(); // save changes
    };

    view.addSignalListener(selectionName, debounce(fn as any, wait));
  }
}
