/* eslint-disable @typescript-eslint/no-non-null-assertion */

import embed from 'vega-embed';
import { TopLevelSpec, compile } from 'vega-lite';
import { deepClone } from '../utils/deepClone';

import { isSelectionParameter } from 'vega-lite/build/src/selection';
import { JoinAggregateTransform } from 'vega-lite/build/src/transform';
import { pipe } from '../utils/pipe';
import { VegaLiteSpecProcessor, processSpec } from '../vegaL/spec';
import { addEncoding } from '../vegaL/spec/encoding';
import {
  extractFilterFields,
  getCompositeOutFilterFromSelections,
  invertFilter
} from '../vegaL/spec/filter';
import {
  AnyUnitSpec,
  Callback,
  removeUnitSpecName,
  removeUnitSpecSelectionFilters,
  removeUnitSpecSelectionParams
} from '../vegaL/spec/view';
import { Interaction, Interactions } from './types';

export class ApplyInteractions {
  static cache: Map<TopLevelSpec, Map<Interaction, TopLevelSpec>> = new Map();

  constructor(private interactions: Interactions) {
    //
  }

  apply(spec: TopLevelSpec) {
    const vlProc = VegaLiteSpecProcessor.init(spec);

    this.interactions.forEach(interaction => {
      this.applyInteraction(vlProc, interaction);
    });

    return vlProc.spec;
  }

  applyInteraction(vlProc: VegaLiteSpecProcessor, interaction: Interaction) {
    switch (interaction.type) {
      case 'selection':
        this.applySelection(vlProc, interaction);
        break;
      case 'filter':
        this.applyFilter(vlProc, interaction);
        break;
      case 'aggregate':
        this.applyAggregate(vlProc, interaction);
        break;
      default:
        break;
    }
  }

  // NOTE: For point selection, try tupleId? refer to selection.ts #8
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

  applyFilter(
    vlProc: VegaLiteSpecProcessor,
    filter: Interactions.FilterAction
  ) {
    const layerName = 'FILTER';

    const params = vlProc.params;

    const outFilter = getCompositeOutFilterFromSelections(
      params.filter(isSelectionParameter)
    );

    vlProc.updateTopLevelParameter(p => {
      delete p.value;
      return p;
    });

    function addFilterOutLayer(spec: AnyUnitSpec) {
      const { transform = [] } = spec;

      const fl =
        filter.direction === 'out' ? outFilter : invertFilter(outFilter);
      transform.push(fl);

      spec.transform = transform;

      return spec;
    }

    vlProc.addLayer(layerName, addFilterOutLayer);

    console.log(vlProc.spec);
  }

  applyAggregate(
    vlProc: VegaLiteSpecProcessor,
    _aggregate: Interactions.AggregateAction
  ): TopLevelSpec {
    const outFilterLayer = 'BASE_OUT_FILTER';

    const params = vlProc.params;

    const selections = params.filter(isSelectionParameter);
    const outFilter = getCompositeOutFilterFromSelections(selections);
    const inFilter = invertFilter(outFilter);

    vlProc.updateTopLevelParameter(p => {
      if (isSelectionParameter(p)) {
        delete p.value;
      }
      return p;
    });

    function addFilterOutLayer(spec: AnyUnitSpec) {
      const { transform = [] } = spec;

      const fl = outFilter;
      transform.push(fl);

      spec.transform = transform;

      return spec;
    }

    vlProc.addLayer(outFilterLayer, addFilterOutLayer);

    console.log(vlProc.spec);

    const filteredOutLayer: Callback = uSpec => {
      const { transform = [] } = uSpec; // get existing transforms

      transform.push(outFilter); // add new filters
      uSpec.transform = transform;

      return uSpec;
    };

    const filteredInLayer: any = (uSpec: any) => {
      const { transform = [] } = uSpec;

      transform.push(inFilter); // add new filters

      uSpec.transform = transform;
      uSpec.encoding = addEncoding(uSpec.encoding, 'fillOpacity', {
        value: 0.2
      });
      uSpec.encoding = addEncoding(uSpec.encoding, 'strokeOpacity', {
        value: 0.8
      });

      return pipe(
        removeUnitSpecName,
        removeUnitSpecSelectionParams,
        removeUnitSpecSelectionFilters
      )(uSpec);
    };
    const aggregateLayer: any = (uSpec: any) => {
      const { transform = [] } = uSpec;

      transform.push(inFilter); // add new filters

      const fields = extractFilterFields(inFilter);

      const agg: JoinAggregateTransform = {
        joinaggregate: fields.map(field => {
          return {
            field,
            as: field,
            op: 'distinct'
          };
        })
      };

      transform.push(agg);

      uSpec.transform = transform;
      return pipe(
        removeUnitSpecName,
        removeUnitSpecSelectionParams,
        removeUnitSpecSelectionFilters
      )(uSpec);
    };

    const spec = processSpec(
      pipe as any,
      ((uSpec: any) => {
        const layer = {
          layer: [
            filteredOutLayer(deepClone(uSpec as any)),
            filteredInLayer(deepClone(uSpec as any)),
            aggregateLayer(deepClone(uSpec as any))
          ]
        };

        return layer;
      }) as any
    );

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
