/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TopLevelSpec } from 'vega-lite';
import { TrrackableCell } from '../cells';
import { accessCategoryManager } from '../notebook/categories/manager';
import { VegaLiteSpecProcessor } from '../vegaL/spec';
import { applyAggregate } from '../vegaL/spec/aggregate';
import { applyCategory } from '../vegaL/spec/categorize';
import { applyDropColumns, applyRenameColumn } from '../vegaL/spec/columns';
import { applyFilter } from '../vegaL/spec/filter';
import { applyLabel } from '../vegaL/spec/label';
import { applyNote } from '../vegaL/spec/note';
import { applySelection } from '../vegaL/spec/selection';
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
        vlProc = applySelection(vlProc, interaction);
        break;
      case 'filter':
        vlProc = applyFilter(vlProc, interaction);
        break;
      case 'aggregate':
        vlProc = applyAggregate(vlProc, interaction);
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
      case 'rename-column':
        vlProc = applyRenameColumn(vlProc, interaction);
        break;
      case 'drop-columns':
        vlProc = applyDropColumns(vlProc, interaction);
        break;
      default:
        break;
    }
  }
}
