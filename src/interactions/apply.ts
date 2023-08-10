/* eslint-disable @typescript-eslint/no-non-null-assertion */

import embed from 'vega-embed';
import { TopLevelSpec, compile } from 'vega-lite';

import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { TrrackableCell } from '../cells';
import { accessCategoryManager } from '../notebook/categories/manager';
import { VegaLiteSpecProcessor } from '../vegaL/spec';
import { applyAggregate } from '../vegaL/spec/aggregate';
import { applySort } from '../vegaL/spec/sort';
import { applyCategory } from '../vegaL/spec/categorize';
import { applyFilter } from '../vegaL/spec/filter';
import { applyLabel } from '../vegaL/spec/label';
import { applyNote } from '../vegaL/spec/note';
import { Interaction, Interactions } from './types';

export class ApplyInteractions {
  static cache: Map<TopLevelSpec, Map<Interaction, TopLevelSpec>> = new Map();

  constructor(
    private interactions: Interactions,
    private _cell: TrrackableCell
  ) {}

  get _id() {
    return this._cell.id;
  }

  apply(spec: TopLevelSpec) {
    const vlProc = VegaLiteSpecProcessor.init(spec);

    this.interactions.forEach(interaction => {
      this.applyInteraction(vlProc, interaction);
    });

    return vlProc.spec;
  }

  applyInteraction(vlProc: VegaLiteSpecProcessor, interaction: Interaction) {
    const cm = accessCategoryManager();

    switch (interaction.type) {
      case 'selection':
        this.applySelection(vlProc, interaction);
        break;
      case 'filter':
        vlProc = applyFilter(vlProc, interaction);
        break;
      case 'aggregate':
        vlProc = applyAggregate(vlProc, interaction);
        break;
      case 'sort':
        vlProc = applySort(vlProc, interaction);
        break;
      case 'categorize':
        if (cm.activeCategory()?.name === interaction.categoryName) {
          vlProc = applyCategory(vlProc, interaction);
        }
        break;
      case 'label':
        vlProc = applyLabel(vlProc, interaction.label);
        break;
      case 'note':
        vlProc = applyNote(vlProc, interaction.note);
        break;
      default:
        break;
    }
  }

  applySelection(
    vlProc: VegaLiteSpecProcessor,
    selection: Interactions.SelectionAction
  ) {
    vlProc.updateTopLevelParameter(param => {
      if (isSelectionParameter(param) && param.name === selection.name) {
        param.value = selection.value;
      }

      return param;
    });
  }
}

export async function getDataFromVegaSpec(spc: any, _opt = true) {
  if (_opt) {
    return [];
  }

  const div = document.createElement('div');
  const vg = compile(spc as any);

  const { view } = await embed(div, vg.spec);

  const dataState = view.getState({
    data: (n?: string) => {
      return !!n;
    }
  }).data;

  const dataSources = Object.keys(dataState)
    .filter(d => d.startsWith('data_'))
    .sort()
    .reverse();

  const finalDatasetName = dataSources[0];

  const sourceData = view.data('source_0');
  const finalData = view.data(finalDatasetName);

  const data = [...sourceData, ...finalData];

  view.finalize();
  div.remove();

  return data;
}
