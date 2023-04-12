/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { JSONArray } from '@lumino/coreutils';
import { applyPatch, deepClone } from 'fast-json-patch';
import { JSONPath as jp } from 'jsonpath-plus';
import {
  Interaction,
  Interactions,
  SelectionInterval,
  SelectionIntervalInit,
  SelectionParams
} from '../types';

export class ApplyInteractions {
  static cache: Map<any, Map<Interaction, any>> = new Map();

  constructor(private interactions: Interactions) {}

  apply(spec: any) {
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

    let newSpec: any;

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

  applySelectionInterval(spec: any, selection: SelectionInterval) {
    const { params } = selection;

    console.log(params);

    const selectionInit: SelectionIntervalInit = {
      x: params.x.domain,
      y: params.y.domain
    };

    const newSpec = applyPatch(JSON.parse(JSON.stringify(spec)), [
      {
        op: 'replace',
        path: `${selection.path}/init`,
        value: deepClone(selectionInit)
      }
    ]);

    return newSpec.newDocument;
  }

  applyFilter(spec: any) {
    spec.transform = spec.transform || [];

    const filters: JSONArray = [];

    const selectionPaths = jp({
      path: '$..selection[?(@parentProperty !== "encoding")]',
      json: spec,
      resultType: 'all'
    });

    for (let i = 0; i < selectionPaths.length; ++i) {
      const selectionPath = selectionPaths[i];
      const value = selectionPath.value;
      const init = value?.init;
      const type = selectionPath.value.type;

      if (init) {
        if (type === 'interval') {
          filters.push({
            not: {
              selection: selectionPath.parentProperty
            }
          });
        }
      }
    }

    const filterPaths = jp({
      path: '$..transform[?(@.filter)]',
      json: spec,
      resultType: 'all'
    }) as any[];

    console.log(filterPaths);

    // const previousFilters = [].concat(
    //   ...filterPaths.map(p => p.value.filter.and)
    // );

    const newSpec = applyPatch(
      deepClone(spec),
      deepClone([
        {
          op: 'add',
          path: '/transform',
          value: []
        },
        {
          op: 'add',
          path: '/transform/0',
          value: {
            filter: {}
          }
        },
        {
          op: 'add',
          path: '/transform/0/filter',
          value: {
            and: filters
          }
        }
      ])
    ).newDocument;

    return newSpec;
  }
}

// export function getQueryStringFromSelectionInterval({
//   params: { selection }
// }: SelectionInterval): string {
//   const subQueries: string[] = [];
//   Object.entries(selection).forEach(([dimension, range]) => {
//     subQueries.push(
//       `${Math.round(range[0] * 1000) / 1000} <= ${dimension} <= ${
//         Math.round(range[1] * 1000) / 1000
//       }`
//     );
//   });

//   return subQueries.filter(q => q.length > 0).length > 0
//     ? subQueries.join(' & ')
//     : '';
// }

export function getRangeFromSelectionInterval(
  params: SelectionParams<SelectionInterval>
): Array<{
  field: string;
  range: number[];
}> {
  const ranges: {
    field: string;
    range: number[];
  }[] = [];

  ranges.push({
    field: params.x.field,
    range: params.x.domain
  });
  ranges.push({
    field: params.y.field,
    range: params.y.domain
  });

  return ranges;
}
