import { createRender, useModel, useModelState } from '@anywidget/react';
import { AnyModel } from '@anywidget/types';
import { Stack } from '@mantine/core';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { VegaLite } from 'react-vega';
import { View } from 'vega';
import { TopLevelSpec } from 'vega-lite';
import { SelectionParameter } from 'vega-lite/build/src/selection';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';
import { Interactions } from '../../interactions/interaction';
import { parseStringify } from '../../utils/jsonHelpers';
import { Nullable } from '../../utils/nullable';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Vegalite({ cell }: Props) {
  const [spec] = useModelState<TopLevelSpec>('spec');
  const [interactions] = useModelState<Interactions>('interactions');
  const [view, setView] = useState<Nullable<View>>(null);
  const model = useModel();

  const newViewCallback = useCallback(
    (view: View) => {
      addSignalListeners(cell, view, model);
      setView(view);
    },
    [cell, model]
  );

  useEffect(() => {
    cell.vegaliteSpecState.set(spec);
  }, [spec, cell]);

  useEffect(() => {
    if (!view) {
      return;
    }

    interactions.forEach(async interaction => {
      switch (interaction.type) {
        case 'select':
          view.signal(`${interaction.name}_store`, interaction.selected.store);
          break;
      }
    });

    view.runAsync();
  }, [view, interactions]);

  return (
    <Stack>
      <VegaLite spec={spec} onNewView={newViewCallback} />
    </Stack>
  );
}

export const render = createRender(withTrrackableCell(Vegalite));

function addSignalListeners(cell: TrrackableCell, view: View, model: AnyModel) {
  const { trrackActions = null } = cell;

  if (!trrackActions) {
    return;
  }

  const selectionNames: string[] = model.get('selection_names');
  const wait: number = model.get('debounce_wait') || 200;

  for (const selectionName of selectionNames) {
    const storeName = `${selectionName}_store`;
    const fn = async (_: unknown, value: SelectionParameter['value']) => {
      const selections = parseStringify(model.get('selections')) || {};
      const selectionParamDefs =
        parseStringify(model.get('param_object_map')) || {};
      const store = parseStringify(view.data(storeName)) || {};

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

    view.addSignalListener(selectionName, debounce(fn, wait));
  }
}
