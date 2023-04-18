/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AddOperation,
  RemoveOperation,
  applyPatch,
  deepClone
} from 'fast-json-patch';
import { JSONPath as jp } from 'jsonpath-plus';
import { JsonPathRType } from '../utils/jsonPathTypes';
import {
  SelectionIntervalInit,
  VegaSelection,
  VegaTransform,
  Vegalite4Spec
} from '../vegaL/types';
import { getFiltersFromRangeSelection } from './helpers';
import { Interaction, Interactions } from './types';

export class ApplyInteractions {
  static cache: WeakMap<Vegalite4Spec, Map<Interaction, Vegalite4Spec>> =
    new WeakMap();

  constructor(private interactions: Interactions) {}

  apply(spec: Vegalite4Spec) {
    const isSpecCached = ApplyInteractions.cache.has(spec);
    if (!isSpecCached) ApplyInteractions.cache.set(spec, new Map());

    const cache = ApplyInteractions.cache.get(spec)!;

    this.interactions.forEach(interaction => {
      spec = this.applyInteraction(spec, interaction, cache);
    });

    return spec;
  }

  applyInteraction(
    spec: any,
    interaction: Interaction,
    cache: Map<Interaction, any>
  ) {
    if (cache.has(interaction)) return cache.get(interaction)!;

    let newSpec: Vegalite4Spec;

    switch (interaction.type) {
      case 'filter':
        newSpec = this.applyFilter(spec);
        break;
      case 'selection_interval':
        newSpec = this.applySelectionInterval(spec, interaction);
        break;
      default:
        newSpec = spec;
        break;
    }

    cache.set(interaction, newSpec);
    return newSpec;
  }

  applySelectionInterval(
    spec: Vegalite4Spec,
    selection: Interactions.SelectionInterval
  ): Vegalite4Spec {
    const { params } = selection;

    const selectionInit: SelectionIntervalInit = {
      x: params.x.domain,
      y: params.y.domain,
      __ide__: selection
    };

    const newSpec = applyPatch<Vegalite4Spec>(
      JSON.parse(JSON.stringify(spec)),
      [
        {
          op: 'replace',
          path: `${selection.path}/init`,
          value: deepClone(selectionInit)
        }
      ]
    );

    return newSpec.newDocument;
  }

  applyFilter(spec: Vegalite4Spec): Vegalite4Spec {
    const selectionPaths: Array<JsonPathRType<VegaSelection>> = jp({
      path: '$..selection[?(@parentProperty !== "encoding")]',
      json: spec,
      resultType: 'all'
    });

    const ops: (RemoveOperation | AddOperation<VegaTransform>)[] = [];

    const transform = (deepClone(spec.transform) as VegaTransform) || [];

    for (let i = 0; i < selectionPaths.length; ++i) {
      const selectionPath = selectionPaths[i];
      const value = selectionPath.value as any;
      const init = value.init;
      const type = selectionPath.value.type;

      if (init) {
        const filterRange = getFiltersFromRangeSelection(init.__ide__.params);

        if (type === 'interval') {
          transform.push({
            filter: {
              not: {
                and: filterRange
              }
            }
          });
        }

        ops.push({
          op: 'remove',
          path: `${selectionPath.pointer}/init`
        });
      }
    }

    ops.push({
      op: 'add',
      path: '/transform',
      value: transform
    });

    const newSpec = applyPatch<Vegalite4Spec>(deepClone(spec), ops).newDocument;

    return newSpec;
  }
}
