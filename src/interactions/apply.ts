/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TopLevelSpec } from 'vega-lite';
import { isUnitSpec } from 'vega-lite/build/src/spec';
import { WindowTransform } from 'vega-lite/build/src/transform';
import { TrrackableCell } from '../cells';
import { accessCategoryManager } from '../notebook/categories/manager';
import { VegaLiteSpecProcessor } from '../vegaL/spec';
import { applyAggregate } from '../vegaL/spec/aggregate';
import { applyCategory } from '../vegaL/spec/categorize';
import { applyDropColumns, applyRenameColumn } from '../vegaL/spec/columns';
import { applyFilter } from '../vegaL/spec/filter';
import { applyLabel } from '../vegaL/spec/label';
import { applyNote } from '../vegaL/spec/note';
import { applyInvertSelection, applySelection } from '../vegaL/spec/selection';
import { Interaction, Interactions } from './types';

export type SelectionInteractionGroups = Array<
  Array<Interactions.SelectionAction>
>;

export const ROW_ID = '__row_id__';

export const ID_TRANSFORM: WindowTransform = {
  window: [
    {
      op: 'count',
      as: ROW_ID
    }
  ]
};

export class ApplyInteractions {
  static cache: Map<TopLevelSpec, Map<Interaction, TopLevelSpec>> = new Map();

  selectionInteractions: Array<Array<Interactions.SelectionAction>> = [];
  currentSelectionGroup: Array<Interactions.SelectionAction> = [];

  constructor(
    private interactions: Interactions,
    private _cell: TrrackableCell,
    private _showOriginalAggregate: boolean
  ) {}

  get _id() {
    return this._cell.id;
  }

  async apply(spec: TopLevelSpec) {
    if (isUnitSpec(spec) && !spec.encoding) {
      return spec;
    }

    const vlProc = VegaLiteSpecProcessor.init(spec);

    for (let i = 0; i < this.interactions.length; ++i) {
      await this.applyInteraction(vlProc, this.interactions[i]);
    }

    return vlProc.spec;
  }

  async applyInteraction(
    vlProc: VegaLiteSpecProcessor,
    interaction: Interaction
  ) {
    const cm = accessCategoryManager();

    // vlProc.updateTopLevelTransform(transforms => {
    //   if (!transforms.filter(isWindow).find(w => w.window[0].as === ROW_ID)) {
    //     transforms.push(ID_TRANSFORM);
    //   }

    //   return transforms;
    // });

    if (interaction.type === 'selection') {
      this.currentSelectionGroup.push(interaction);
    } else {
      if (
        this.currentSelectionGroup.length > 0 &&
        interaction.type !== 'filter'
      ) {
        this.selectionInteractions.push(this.currentSelectionGroup.slice());
        this.currentSelectionGroup = [];
      }
    }

    switch (interaction.type) {
      case 'selection':
        vlProc = applySelection(vlProc, interaction);
        break;
      case 'invert-selection':
        vlProc = await applyInvertSelection(
          vlProc,
          this.selectionInteractions.slice()
        );
        break;
      case 'filter':
        vlProc = applyFilter(vlProc, interaction);
        break;
      case 'aggregate':
        vlProc = applyAggregate(
          vlProc,
          interaction,
          this.selectionInteractions.slice(),
          this._showOriginalAggregate
        );
        break;
      case 'categorize':
        if (cm.activeCategory()?.name === interaction.categoryName) {
          vlProc = applyCategory(
            vlProc,
            interaction,
            this.selectionInteractions.slice()
          );
        }
        break;
      case 'label':
        vlProc = applyLabel(
          vlProc,
          interaction,
          this.selectionInteractions.slice()
        );
        break;
      case 'note':
        vlProc = applyNote(
          vlProc,
          interaction,
          this.selectionInteractions.slice()
        );
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

    console.groupEnd();
  }
}
