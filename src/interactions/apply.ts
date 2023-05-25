/* eslint-disable @typescript-eslint/no-non-null-assertion */

import embed from 'vega-embed';
import { TopLevelSpec, compile } from 'vega-lite';
import { deepClone } from '../utils/deepClone';

import { JSONPath } from 'jsonpath-plus';
import { isArray } from 'lodash';
import { LogicalComposition } from 'vega-lite/build/src/logical';
import { Predicate } from 'vega-lite/build/src/predicate';
import { CalculateTransform, Transform } from 'vega-lite/build/src/transform';
import { JSONPathResult, getJSONPath } from '../utils/jsonpath';
import {
  getEncodingsForSelection,
  isSelectionPoint,
  isTopLevelSelectionParameter,
  setParameterValue
} from '../vegaL/spec';
import { getFieldNamesFromEncoding } from '../vegaL/spec/encoding';
import { getEncodingForNamedView } from '../vegaL/spec/view';
import { Interaction, Interactions } from './types';

export class ApplyInteractions {
  static cache: Map<TopLevelSpec, Map<Interaction, TopLevelSpec>> = new Map();

  constructor(private interactions: Interactions) {
    //
  }

  apply(spec: TopLevelSpec) {
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
    spec: TopLevelSpec,
    interaction: Interaction,
    cache: Map<Interaction, any>
  ) {
    if (cache.has(interaction)) {
      return cache.get(interaction)!;
    }

    let newSpec: TopLevelSpec;

    switch (interaction.type) {
      case 'interval':
        newSpec = this.applySelectionInterval(spec, interaction);
        break;
      case 'point':
        newSpec = this.applyPointInterval(spec, interaction);
        break;
      case 'filter':
        newSpec = this.applyFilter(spec, interaction);
        break;
      case 'aggregate':
        newSpec = this.applyAggregate(spec, interaction);
        break;
      default:
        newSpec = spec;
        break;
    }

    if (!newSpec)
      throw new Error(
        `Apply interaction failed for interaction: ${interaction.id}`
      );

    cache.set(interaction, newSpec);
    return newSpec;
  }

  // NOTE: For point selection, try tupleId? refer to selection.ts #8
  applySelectionInterval(
    spec: TopLevelSpec,
    selection: Interactions.SelectionAction<'interval'>
  ): TopLevelSpec {
    setParameterValue(spec, selection.name, selection.value);

    return spec;
  }

  applyPointInterval(
    spec: TopLevelSpec,
    selection: Interactions.SelectionAction<'point'>
  ) {
    setParameterValue(spec, selection.name, selection.value);

    return spec;
  }

  applyFilter(
    spec: TopLevelSpec,
    filter: Interactions.FilterAction
  ): TopLevelSpec {
    const params = spec.params || [];

    const transform: Transform[] = [];

    const dataPaths: JSONPathResult = JSONPath({
      json: spec,
      path: "$..*[?(@property === 'data')]^",
      resultType: 'all'
    });

    params.filter(isTopLevelSelectionParameter).forEach(selection => {
      if (isSelectionPoint(selection)) {
        const { value } = selection;

        if (value && Array.isArray(value)) {
          value.forEach(val => {
            const [k, v] = Object.entries(val)[0];

            if (v) {
              let filterExp: LogicalComposition<Predicate> = {
                field: k,
                equal: v
              };

              if (filter.direction === 'out') {
                filterExp = {
                  not: filterExp
                };
              }

              transform.push({
                filter: filterExp
              });
            }
          });
        } else {
          throw new Error('Handle');
        }
      } else {
        throw new Error('Handle');
      }

      delete selection.value;
    });

    dataPaths.forEach(d => {
      const pathArray = JSONPath.toPathArray(d.path);

      const val = pathArray.reduce(
        (obj: any, n) => (n === '$' ? obj : obj && obj[n]),
        spec
      );

      if (!val) return val;

      if (!val.transform) val.transform = [];
      val.transform.push(...transform);
    });

    return spec;
  }

  applyAggregate(
    spec: TopLevelSpec,
    _aggregate: Interactions.AggregateAction
  ): TopLevelSpec {
    const params = spec.params || [];

    const transform: Transform[] = [];

    const dataPaths: JSONPathResult = getJSONPath(
      spec,
      "$..*[?(@property === 'data')]^"
    );

    params.filter(isTopLevelSelectionParameter).forEach(selection => {
      const { views = [] } = selection;
      if (isSelectionPoint(selection)) {
        const encoding = getEncodingForNamedView(spec, views[0]);

        const selectionEncodings = getEncodingsForSelection(selection);

        if (!encoding) return;

        const fieldNames = getFieldNamesFromEncoding(
          encoding,
          selectionEncodings
        );

        if (!fieldNames) return;

        const calculateTransforms = selectionEncodings.map(_s => {
          const s = fieldNames[_s] as string;
          const value = selection.value;

          const arr = isArray(value) ? value.map(_v => _v[s]) : [];

          const arrStr = arr.map(s => `'${s}'`).join(',');

          return {
            calculate: `if(indexof([${arrStr}], datum.${s}) >= 0, '${arr
              .map(s => `${s}`)
              .join('_')}', datum.${s})`,
            as: s
          } as CalculateTransform;
        });

        transform.push(...calculateTransforms);
      } else {
        throw new Error('Handle');
      }

      delete selection.value;
    });

    dataPaths.forEach(d => {
      const pathArray = JSONPath.toPathArray(d.path);

      const val = pathArray.reduce(
        (obj: any, n) => (n === '$' ? obj : obj && obj[n]),
        spec
      );

      if (!val) return val;

      if (!val.transform) val.transform = [];

      val.transform.push(...transform);
    });

    console.log(spec);

    return spec;
  }
}

export async function getDataFromVegaSpec(spc: any, _opt = true) {
  if (_opt) return [];

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
