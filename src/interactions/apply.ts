/* eslint-disable @typescript-eslint/no-non-null-assertion */
// import {
//   AddOperation,
//   RemoveOperation,
//   ReplaceOperation,
//   applyPatch,
//   deepClone
// } from 'fast-json-patch';

import { immutableJSONPatch, JSONPatchOperation } from 'immutable-json-patch';
import embed from 'vega-embed';
import { compile } from 'vl4';
import { isLogicalNot, LogicalAnd } from 'vl4/build/src/logical';
import { isUnitSpec, UnitSpec } from 'vl4/build/src/spec';
import { isFilter } from 'vl4/build/src/transform';
import { deepClone } from '../utils/deepClone';
import { isSelectionInterval, VL4 } from '../vegaL/types';
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
      spec = this.applyInteraction(
        deepClone(spec),
        deepClone(interaction),
        cache
      );
    });

    return spec;
  }

  applyInteraction(
    spec: VL4.Spec,
    interaction: Interaction,
    cache: Map<Interaction, any>
  ) {
    if (cache.has(interaction)) {
      return cache.get(interaction)!;
    }

    let newSpec: VL4.Spec;

    switch (interaction.type) {
      case 'selection_interval':
        newSpec = this.applySelectionInterval(
          deepClone(spec as any),
          deepClone(interaction)
        );
        break;
      case 'filter':
        newSpec = this.applyFilter(spec);
        break;
      case 'aggregate':
        newSpec = this.applyAggregate(spec);

        break;
      default:
        newSpec = spec;
        break;
    }

    cache.set(interaction, newSpec);
    return newSpec;
  }

  // NOTE: For point selection, try tupleId? refer to selection.ts #8
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

  applyFilter<T extends VL4.Spec>(spec: T): T {
    if (isUnitSpec(spec)) {
      const selections = spec.selection || {};
      const transform = spec.transform || [];

      // Check transform.ts #679 for normalize?
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

  applyAggregate(spec: VL4.Spec): VL4.Spec {
    const _spec = deepClone(spec);
    if (isUnitSpec(spec)) {
      const filteredSpec = this.applyFilter(spec);

      const patches: JSONPatchOperation[] = [];

      patches.push({
        op: 'remove',
        path: '/mark'
      });
      patches.push({
        op: 'remove',
        path: '/transform'
      });
      patches.push({
        op: 'remove',
        path: '/encoding'
      });
      patches.push({
        op: 'remove',
        path: '/selection'
      });

      const { encoding = {}, transform = [] } = deepClone(filteredSpec);

      const baseLayer: UnitSpec = {
        ...filteredSpec,
        transform: transform.filter(t => !isFilter(t)),
        encoding: {
          ...encoding,
          opacity: {
            condition: {
              test: transform.reduce(
                (acc, tr) => {
                  if (isFilter(tr)) {
                    acc.not.and.push(tr.filter);
                  }

                  return acc;
                },
                {
                  not: {
                    and: []
                  } as LogicalAnd<any>
                }
              ),
              value: 0.2
            },
            value: 0.7
          }
        }
      };

      console.log(encoding);

      const aggregatePoint: UnitSpec = {
        mark: filteredSpec.mark,
        transform: [
          ...transform.map(t => {
            if (isFilter(t)) {
              if (isLogicalNot(t.filter)) t.filter = t.filter.not;
            }
            return t;
          }),
          {
            aggregate: [
              {
                op: 'mean',
                field: (encoding.x as any).field,
                as: `${(encoding.x as any).field}_a`
              },
              {
                op: 'mean',
                field: (encoding.y as any).field,
                as: `${(encoding.y as any).field}_a`
              }
            ]
          }
        ],
        encoding: {
          x: {
            ...encoding.x,
            field: `${(encoding.x as any).field}_a`
          },
          y: {
            ...encoding.y,
            field: `${(encoding.y as any).field}_a`
          },
          color: {
            value: 'green'
          },
          size: {
            value: 200
          },
          strokeWidth: {
            value: 1.5
          }
        }
      };

      patches.push({
        op: 'add',
        path: '/layer',
        value: [aggregatePoint, baseLayer] as any
      });

      // const updatedTransforms = transform.map(transform => {
      //   if (isFilter(transform) && isLogicalNot(transform.filter)) {
      //     transform.filter = transform.filter.not;
      //   }

      //   return transform;
      // });

      // const aggregateTransform: AggregateTransform = {
      //   aggregate: [
      //     {
      //       op: 'mean',
      //       as: `${(spec.encoding as any).x.field}_a`,
      //       field: (spec.encoding as any).x.v
      //     },
      //     {
      //       op: 'mean',
      //       as: `${(spec.encoding as any).y.field}_a`,
      //       field: (spec.encoding as any).y.field
      //     }
      //   ]
      // };

      const newLayerSpec = immutableJSONPatch(
        filteredSpec as any,
        patches
      ) as VL4.Spec;

      console.group('Spec');
      console.log('original', _spec);
      console.log('normalized', compile(_spec as any).normalized);
      console.log('new', filteredSpec);
      console.groupEnd();

      return newLayerSpec;
    }

    return _spec;
  }
}

export async function getDataFromVegaSpec(spc: any) {
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
