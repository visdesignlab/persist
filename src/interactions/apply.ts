/* eslint-disable @typescript-eslint/no-non-null-assertion */
// import {
//   AddOperation,
//   RemoveOperation,
//   ReplaceOperation,
//   applyPatch,
//   deepClone
// } from 'fast-json-patch';
import { isUnitSpec } from 'vl4/build/src/spec';
import { deepClone } from '../utils/deepClone';
import { VL4, isSelectionInterval } from '../vegaL/types';
import { getFiltersFromRangeSelection } from './helpers';
import { Interaction, Interactions } from './types';

export class ApplyInteractions {
  static cache: Map<VL4.Spec, Map<Interaction, VL4.Spec>> = new Map();

  constructor(private interactions: Interactions) {
    //
  }

  apply(spec: VL4.Spec) {
    const isSpecCached = ApplyInteractions.cache.has(spec);
    if (!isSpecCached) ApplyInteractions.cache.set(spec, new Map());

    const cache = ApplyInteractions.cache.get(spec)!;

    this.interactions.forEach(interaction => {
      spec = this.applyInteraction(spec, interaction, cache);
    });

    return spec;
  }

  applyInteraction(
    spec: VL4.Spec,
    interaction: Interaction,
    cache: Map<Interaction, any>
  ) {
    if (cache.has(interaction)) {
      console.log('Cache');
      return cache.get(interaction)!;
    }

    let newSpec: VL4.Spec;

    switch (interaction.type) {
      case 'filter':
        newSpec = this.applyFilter(deepClone(spec));
        break;
      case 'selection_interval':
        newSpec = this.applySelectionInterval(
          deepClone(spec as any),
          deepClone(interaction)
        );
        break;
      default:
        newSpec = spec;
        break;
    }

    cache.set(interaction, newSpec);
    return newSpec;
  }

  applySelectionInterval(
    spec: VL4.Spec<Interactions.IntervalSelectionAction>,
    selection: Interactions.IntervalSelectionAction
  ): VL4.Spec {
    // Update ide params
    if (!spec.usermeta)
      spec.usermeta = {
        __ide__: selection
      };
    spec.usermeta.__ide__ = selection;

    // Create init if applicable from interaction
    const selectionInit = Interactions.IntervalSelectionAction.init(selection);

    if (!selectionInit) {
      if (isUnitSpec(spec)) {
        delete (spec as any).selection[selection.name].init;
      }
    } else {
      (spec as any).selection[selection.name].init = selectionInit;
    }

    return spec;
  }

  applyFilter(spec: VL4.Spec): VL4.Spec {
    if (isUnitSpec(spec)) {
      const selections = spec.selection || {};
      const transform = spec.transform || [];

      Object.entries(selections).forEach(([name, selection]) => {
        // Check selection type and create filter
        if (isSelectionInterval(selection)) {
          const filterRange = getFiltersFromRangeSelection(
            spec as any,
            selection
          );

          transform.push({
            filter: {
              not: {
                and: filterRange
              }
            }
          });
        }

        delete (spec as any).selection[name].init;
      });

      spec.transform = transform;
    }

    return spec;
  }
}
