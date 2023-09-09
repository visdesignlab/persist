import { createRender, useModel, useModelState } from '@anywidget/react';
import { AnyModel } from '@anywidget/types';
import { Stack } from '@mantine/core';
import { debounce } from 'lodash';
import React, { useEffect } from 'react';
import { VegaLite } from 'react-vega';
import { View } from 'vega';
import { TopLevelSpec } from 'vega-lite';
import { SelectionParameter } from 'vega-lite/build/src/selection';
import { TrrackableCell } from '../../cells';
import { PersistCommands } from '../../commands';
import { parseStringify } from '../../utils/jsonHelpers';
import { withTrrackableCell } from '../utils/useCell';

type Props = {
  cell: TrrackableCell;
};

function Vegalite({ cell }: Props) {
  const [spec] = useModelState<TopLevelSpec>('spec');
  const model = useModel();

  useEffect(() => {
    cell.vegaliteSpecState.set(spec);
  }, [spec, cell]);

  return (
    <Stack>
      <VegaLite
        spec={spec}
        onNewView={v => {
          addSignalListeners(cell, v, model);
        }}
      />
    </Stack>
  );
}

export const render = createRender(withTrrackableCell(Vegalite));

function addSignalListeners(cell: TrrackableCell, view: View, model: AnyModel) {
  const { trrackActions = null } = cell;

  if (!trrackActions) return;

  const selectionNames: string[] = model.get('selection_names');
  const wait: number = model.get('debounce_wait') || 200;

  for (const selectionName of selectionNames) {
    const storeName = `${selectionName}_store`;
    const fn = async (_: unknown, value: SelectionParameter['value']) => {
      const selections = parseStringify(model.get('selections')) || {};
      const selectionParamDefs =
        parseStringify(model.get('param_object_map ')) || {};
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
