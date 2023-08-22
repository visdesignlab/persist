/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { isEqual } from 'lodash';

import { TopLevelSpec } from 'vega-lite';
import { isUnitSpec } from 'vega-lite/build/src/spec';
import { WindowTransform, isWindow } from 'vega-lite/build/src/transform';
import { TrrackableCell } from '../cells';
import { accessCategoryManager } from '../notebook/categories/manager';
import { getDatasetFromVegaView } from '../vegaL/helpers';
import { VegaLiteSpecProcessor } from '../vegaL/spec';
import { applyAggregate } from '../vegaL/spec/aggregate';
import { applyCategory } from '../vegaL/spec/categorize';
import { applyDropColumns, applyRenameColumn } from '../vegaL/spec/columns';
import { Filter, applyFilter } from '../vegaL/spec/filter';
import { ProcessedResult, getProcessed } from '../vegaL/spec/getProcessed';
import {
  applyIntentSelection,
  applyInvertSelection
} from '../vegaL/spec/intent_invert';
import { applyLabel } from '../vegaL/spec/label';
import { applyNote } from '../vegaL/spec/note';
import { applySelection } from '../vegaL/spec/selection';
import { applySort } from '../vegaL/spec/sort';
import { Interactions } from './types';

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

export const PRED_HOVER_SIGNAL = '__PRED_HOVER_SIGNAL__';

export const HOVER_CONDITIONAL_TEST_PREDICATE = (
  predicate: Filter
): Filter => ({
  or: [
    `if(${PRED_HOVER_SIGNAL}.length > 0, indexof(${PRED_HOVER_SIGNAL}, datum.${ROW_ID}) > -1,false)`,
    {
      and: [`if(${PRED_HOVER_SIGNAL}.length > 0, false, true)`, predicate]
    }
  ]
});

export class ApplyInteractions {
  static cache: Map<string, TopLevelSpec> = new Map();
  static specCache = new Map<string, TopLevelSpec>();

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
      console.error(spec);
      throw new Error('cannot apply interactions to spec');
    }

    let skipCache = false;

    // get stringified spec
    if (ApplyInteractions.cache.has(this._cell.trrackId)) {
      skipCache = !isEqual(
        ApplyInteractions.cache.get(this._cell.trrackId),
        spec
      );
    } else {
      skipCache = true;
      ApplyInteractions.cache.set(this._cell.trrackId, spec);
    }

    if (!skipCache) {
      const cached_spec = ApplyInteractions.specCache.get(
        this.interactions[this.interactions.length - 1].id
      );
      if (cached_spec) {
        return cached_spec;
      }
    }

    const view = this._cell.vegaManager?.view;
    if (!view) {
      throw new Error('No vega view');
    }

    const vlProc = VegaLiteSpecProcessor.init(spec);

    vlProc.updateTopLevelTransform(transforms => {
      if (!transforms.filter(isWindow).find(w => w.window[0].as === ROW_ID)) {
        transforms.push(ID_TRANSFORM);
      }

      return transforms;
    });

    const params = vlProc.params;

    params.push({ name: PRED_HOVER_SIGNAL, value: [] });

    vlProc.params = params;

    const data = getDatasetFromVegaView(view, this._cell.trrackManager);

    const processedResult: Array<ProcessedResult> = await getProcessed(
      data.values,
      this.interactions
    );

    for (let i = 0; i < this.interactions.length; ++i) {
      await this.applyInteraction(
        vlProc,
        this.interactions,
        i,
        processedResult[i]
      );

      const id = this.interactions[i].id;
      ApplyInteractions.specCache.set(id, vlProc.spec);
    }

    return vlProc.spec;
  }

  async applyInteraction(
    vlProc: VegaLiteSpecProcessor,
    interactions: Interactions,
    index: number,
    processedResult: ProcessedResult
  ) {
    const interaction = interactions[index];
    const cm = accessCategoryManager();

    if (interaction.type === 'selection') {
      this.currentSelectionGroup = this.currentSelectionGroup.filter(
        s => s.name !== interaction.name
      );
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
        vlProc = applyInvertSelection(vlProc, processedResult);
        break;
      case 'intent':
        vlProc = applyIntentSelection(vlProc, interaction, processedResult);
        break;
      case 'filter':
        vlProc = applyFilter(vlProc, interaction, processedResult);
        break;
      case 'aggregate':
        vlProc = applyAggregate(
          vlProc,
          interaction,
          processedResult,
          this._showOriginalAggregate
        );
        break;
      case 'sort':
        vlProc = applySort(vlProc, interaction);
        break;
      case 'categorize':
        if (cm.activeCategory()?.name === interaction.categoryName) {
          vlProc = applyCategory(vlProc, interaction, processedResult);
        }
        break;
      case 'label':
        vlProc = applyLabel(vlProc, interaction, processedResult);
        break;
      case 'note':
        vlProc = applyNote(vlProc, interaction, processedResult);
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
