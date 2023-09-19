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
import { Interactions } from '../../interactions/interaction';
import { parseStringify } from '../../utils/jsonHelpers';
import { VegaView } from '../../vega/view';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Vegalite({ cell }: Props) {
  const [spec] = useModelState<TopLevelSpec>('spec');
  const [interactions] = useModelState<Interactions>('interactions');
  const vegaView = useMemo(() => {
    return new VegaView();
  }, []);
  const model = useModel();

  const newViewCallback = useCallback(
    (view: View) => {
      vegaView.setView(view);
      addSignalListeners(cell, vegaView, model);
    },
    [cell, model, vegaView]
  );

  useEffect(() => {
    cell.vegaliteSpecState.set(spec);
  }, [spec, cell]);

  useEffect(() => {
    interactions.forEach(async interaction => {
      switch (interaction.type) {
        case 'select':
          vegaView.setData(
            `${interaction.name}_store`,
            interaction.selected.store
          );

          vegaView.setSignal(
            `${interaction.name}_tuple`,
            interaction.selected.store
          );

          break;
      }
    });

    vegaView.run();
  }, [vegaView, interactions]);

  return (
    <Stack>
      <VegaLite spec={spec} onNewView={newViewCallback} />
    </Stack>
  );
}

export const render = createRender(withTrrackableCell(Vegalite));

function addSignalListeners(
  cell: TrrackableCell,
  view: VegaView,
  model: AnyModel
) {
  const { trrackActions = null } = cell;

  if (!trrackActions) {
    return;
  }

  const selectionNames: string[] = model.get('selection_names');
  const wait: number = model.get('debounce_wait') || 200;

  for (const selectionName of selectionNames) {
    const storeName = `${selectionName}_store`;

    const fn = (_: string, value: SelectionParameter['value']) => {
      const selections = parseStringify(model.get('selections')) || {};
      const selectionParamDefs =
        parseStringify(model.get('param_object_map')) || {};

      const store = parseStringify(view.getData(storeName)) || [];

      window.Persist.Commands.execute(PersistCommands.intervalSelection, {
        cell,
        selection: selectionParamDefs[selectionName],
        store,
        value,
        encodingTypes: {}
      });

      selections[selectionName] = { value, store };

      model.set('selections', selections);
      model.save_changes();
    };

    view.addSignalListener(selectionName, debounce(fn as any, wait));
  }
}
